import express from 'express';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'trajets.db');

// Initialize SQLite database
let db: InstanceType<typeof Database> | null = null;
try {
  console.log(`[Database] Connecting to SQLite at: ${DB_PATH}`);
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create table matching user's SQLite schema with support for all fields
  db.exec(`
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

  // Safely ensure 'periode' column exists if user created table previously without it
  try {
    const tableInfo = db.prepare('PRAGMA table_info(trajets)').all() as Array<{ name: string }>;
    const hasPeriode = tableInfo.some((col) => col.name === 'periode');
    if (!hasPeriode) {
      db.exec('ALTER TABLE trajets ADD COLUMN periode TEXT;');
      console.log('[Database] Added missing column: periode');
    }
  } catch (err) {
    console.warn('[Database] Column verification note:', err);
  }

  const countRow = db.prepare('SELECT count(*) as count FROM trajets').get() as { count: number };
  console.log(`[Database] Connected successfully. Found ${countRow?.count ?? 0} existing trips in trajets.db.`);
} catch (err) {
  console.error('[Database] Failed to open SQLite database:', err);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // ================= API ROUTES =================
  app.get('/api/health', (req, res) => {
    let tripCount = 0;
    if (db) {
      try {
        const row = db.prepare('SELECT count(*) as count FROM trajets').get() as { count: number };
        tripCount = row?.count ?? 0;
      } catch {
        // ignore
      }
    }
    res.json({
      status: 'ok',
      database: db ? 'sqlite' : 'none',
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
      const rows = db.prepare('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC').all();
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

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO trajets (id, date, lieu, motif, heureDepart, heureArrivee, notes, createdAt, periode)
        VALUES (@id, @date, @lieu, @motif, @heureDepart, @heureArrivee, @notes, @createdAt, @periode)
      `);

      const insertMany = db.transaction((trips) => {
        for (const t of trips) {
          insertStmt.run({
            id: t.id || 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            date: t.date || '',
            lieu: t.lieu || '',
            motif: t.motif || '',
            heureDepart: t.heureDepart || '',
            heureArrivee: t.heureArrivee || '',
            notes: t.notes || '',
            createdAt: t.createdAt || Date.now(),
            periode: t.periode || '',
          });
        }
      });

      insertMany(tripsToInsert);
      console.log(`[API] Saved ${tripsToInsert.length} trip(s) to SQLite.`);

      // Return updated list
      const rows = db.prepare('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC').all();
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

      const updateStmt = db.prepare(`
        UPDATE trajets
        SET date = @date,
            lieu = @lieu,
            motif = @motif,
            heureDepart = @heureDepart,
            heureArrivee = @heureArrivee,
            notes = @notes,
            periode = @periode
        WHERE id = @id
      `);

      const result = updateStmt.run({
        id,
        date: t.date || '',
        lieu: t.lieu || '',
        motif: t.motif || '',
        heureDepart: t.heureDepart || '',
        heureArrivee: t.heureArrivee || '',
        notes: t.notes || '',
        periode: t.periode || '',
      });

      if (result.changes === 0) {
        // Fallback insert if not found
        const insertStmt = db.prepare(`
          INSERT INTO trajets (id, date, lieu, motif, heureDepart, heureArrivee, notes, createdAt, periode)
          VALUES (@id, @date, @lieu, @motif, @heureDepart, @heureArrivee, @notes, @createdAt, @periode)
        `);
        insertStmt.run({
          id,
          date: t.date || '',
          lieu: t.lieu || '',
          motif: t.motif || '',
          heureDepart: t.heureDepart || '',
          heureArrivee: t.heureArrivee || '',
          notes: t.notes || '',
          createdAt: t.createdAt || Date.now(),
          periode: t.periode || '',
        });
      }

      const rows = db.prepare('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC').all();
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
      db.prepare("DELETE FROM trajets WHERE id LIKE 'demo-%'").run();
      const rows = db.prepare('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC').all();
      return res.json({ success: true, trips: rows });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to purge demos' });
    }
  });

  // Purge all trips
  app.delete('/api/trips/purge-all', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    try {
      db.prepare('DELETE FROM trajets').run();
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
      db.prepare('DELETE FROM trajets WHERE id = ?').run(id);
      const rows = db.prepare('SELECT * FROM trajets ORDER BY date DESC, heureDepart DESC').all();
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
