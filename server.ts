import express from 'express';
import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'trajets.db');

let db: Database | null = null;

function saveDbToFile() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[Database] Failed to write database to disk:', err);
  }
}

async function initDatabase(): Promise<Database | null> {
  try {
    console.log(`[Database] Initializing SQLite (WASM) for: ${DB_PATH}`);
    const SQL = await initSqlJs();

    let database: Database;
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      database = new SQL.Database(fileBuffer);
      console.log(`[Database] Loaded existing database file: ${DB_PATH}`);
    } else {
      database = new SQL.Database();
      console.log(`[Database] Created new SQLite database in memory.`);
    }

    // Create table matching user's SQLite schema
    database.run(`
      CREATE TABLE IF NOT EXISTS trajets (
        id TEXT PRIMARY KEY,
        date TEXT,
        lieu TEXT,
        motif TEXT,
        heureDepart TEXT,
        heureArrivee TEXT,
        notes TEXT,
        createdAt INTEGER,
        periode TEXT
      );
    `);

    // Ensure 'periode' column exists
    try {
      const res = database.exec('PRAGMA table_info(trajets);');
      if (res.length > 0) {
        const columns = res[0].values.map((row) => row[1]);
        if (!columns.includes('periode')) {
          database.run('ALTER TABLE trajets ADD COLUMN periode TEXT;');
          console.log('[Database] Added missing column: periode');
        }
      }
    } catch (e) {
      console.warn('[Database] Column verify note:', e);
    }

    saveDbToFile();
    return database;
  } catch (err) {
    console.error('[Database] Failed to initialize SQLite database:', err);
    return null;
  }
}

async function startServer() {
  db = await initDatabase();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Helper to query objects
  function queryAll(sql: string, params: any[] = []): any[] {
    if (!db) return [];
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params as any);
    }
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // ================= API ROUTES =================
  app.get('/api/health', (req, res) => {
    let tripCount = 0;
    if (db) {
      try {
        const rows = queryAll('SELECT count(*) as count FROM trajets;');
        tripCount = rows[0]?.count ?? 0;
      } catch {}
    }
    res.json({
      status: 'ok',
      database: db ? 'sqlite-wasm' : 'none',
      dbPath: DB_PATH,
      tripCount,
      timestamp: new Date().toISOString(),
    });
  });

  // GET all trips from SQLite
  app.get('/api/trips', (req, res) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    try {
      const rows = queryAll('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC;');
      return res.json({ trips: rows });
    } catch (err) {
      console.error('[API] Error fetching trips:', err);
      return res.status(500).json({ error: 'Failed to read trips' });
    }
  });

  // POST new trip or multiple trips
  app.post('/api/trips', (req, res) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    try {
      const body = req.body;
      const tripsToInsert = Array.isArray(body) ? body : [body];

      for (const t of tripsToInsert) {
        db.run(
          `INSERT OR REPLACE INTO trajets (id, date, lieu, motif, heureDepart, heureArrivee, notes, createdAt, periode)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.id || 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            t.date || '',
            t.lieu || '',
            t.motif || '',
            t.heureDepart || '',
            t.heureArrivee || '',
            t.notes || '',
            t.createdAt || Date.now(),
            t.periode || '',
          ]
        );
      }
      saveDbToFile();
      console.log(`[API] Saved ${tripsToInsert.length} trip(s) to SQLite.`);

      const rows = queryAll('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC;');
      return res.json({ success: true, count: tripsToInsert.length, trips: rows });
    } catch (err) {
      console.error('[API] Error saving trip:', err);
      return res.status(500).json({ error: 'Failed to save trip' });
    }
  });

  // PUT update single trip
  app.put('/api/trips/:id', (req, res) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    try {
      const { id } = req.params;
      const t = req.body;

      db.run(
        `UPDATE trajets
         SET date = ?,
             lieu = ?,
             motif = ?,
             heureDepart = ?,
             heureArrivee = ?,
             notes = ?,
             periode = ?
         WHERE id = ?;`,
        [
          t.date || '',
          t.lieu || '',
          t.motif || '',
          t.heureDepart || '',
          t.heureArrivee || '',
          t.notes || '',
          t.periode || '',
          id,
        ]
      );

      saveDbToFile();
      const rows = queryAll('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC;');
      return res.json({ success: true, trips: rows });
    } catch (err) {
      console.error('[API] Error updating trip:', err);
      return res.status(500).json({ error: 'Failed to update trip' });
    }
  });

  // Purge demo trips
  app.delete('/api/trips/purge-demos', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    try {
      db.run("DELETE FROM trajets WHERE id LIKE 'demo-%';");
      saveDbToFile();
      const rows = queryAll('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC;');
      return res.json({ success: true, trips: rows });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to purge demos' });
    }
  });

  // Purge all trips
  app.delete('/api/trips/purge-all', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    try {
      db.run('DELETE FROM trajets;');
      saveDbToFile();
      return res.json({ success: true, trips: [] });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to purge all' });
    }
  });

  // DELETE single trip
  app.delete('/api/trips/:id', (req, res) => {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    try {
      const { id } = req.params;
      db.run('DELETE FROM trajets WHERE id = ?;', [id]);
      saveDbToFile();
      const rows = queryAll('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC;');
      return res.json({ success: true, trips: rows });
    } catch (err) {
      console.error('[API] Error deleting trip:', err);
      return res.status(500).json({ error: 'Failed to delete trip' });
    }
  });

  // ================= VITE OR STATIC SERVING =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Suivi-Temps backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Startup error:', err);
});
