import { Trip } from '../types';

const STORAGE_KEY = 'proxmox_lxc_trajets_data_v1';

export const INITIAL_DEMO_TRIPS: Trip[] = [];

export function loadTripsFromStorage(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Error loading trips from localStorage:', err);
    return [];
  }
}

export function saveTripsToStorage(trips: Trip[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Error saving trips to localStorage:', err);
  }
}

export function clearAllTripsFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing localStorage:', err);
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
