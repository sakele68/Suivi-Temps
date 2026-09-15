import { Trip } from '../types';

const STORAGE_KEY = 'proxmox_lxc_trajets_data_v1';

export const INITIAL_DEMO_TRIPS: Trip[] = [
  {
    id: 'demo-1',
    date: '2026-09-15',
    lieu: 'Chantier Résidence Voltaire - Lyon',
    motif: 'Réunion de chantier & livraison',
    heureDepart: '08:00',
    heureArrivee: '09:45',
    notes: 'Livraison matériel & réunion de chantier',
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'demo-2',
    date: '2026-09-15',
    lieu: 'Siège Social / Dépôt Central',
    motif: 'Réapprovisionnement',
    heureDepart: '10:15',
    heureArrivee: '12:00',
    notes: 'Réapprovisionnement outillage',
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'demo-3',
    date: '2026-09-15',
    lieu: 'Client SARL Dupont - Villeurbanne',
    motif: 'Installation technique',
    heureDepart: '13:30',
    heureArrivee: '15:15',
    notes: 'Installation poste technique & vérification',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'demo-4',
    date: '2026-09-14',
    lieu: 'Chantier Résidence Voltaire - Lyon',
    motif: 'Câblage phase 1',
    heureDepart: '08:30',
    heureArrivee: '11:00',
    notes: 'Phase 1 câblage',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'demo-5',
    date: '2026-09-14',
    lieu: 'Centre Logistique Est - Saint-Priest',
    motif: 'Inventaire et contrôle',
    heureDepart: '14:00',
    heureArrivee: '16:45',
    notes: 'Contrôle palettes et inventaire',
    createdAt: Date.now() - 86400000 + 3600000,
  },
];

export function loadTripsFromStorage(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time loading: initialize with demo data
      saveTripsToStorage(INITIAL_DEMO_TRIPS);
      return INITIAL_DEMO_TRIPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_TRIPS;
  } catch (err) {
    console.error('Error loading trips from localStorage:', err);
    return INITIAL_DEMO_TRIPS;
  }
}

export function saveTripsToStorage(trips: Trip[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Error saving trips to localStorage:', err);
  }
}

export function exportBackupJSON(trips: Trip[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trips, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const now = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute("download", `sauvegarde_trajets_${now}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBackupJSON(file: File): Promise<Trip[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          resolve(parsed);
        } else {
          reject(new Error('Format JSON non valide (doit être une liste de trajets)'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
}
