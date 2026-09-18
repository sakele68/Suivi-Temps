import { Trip } from '../types';

const STORAGE_KEY = 'proxmox_lxc_trajets_data_v1';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/suivi-temps')) {
    return '/suivi-temps/api';
  }
  return '/api';
}

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

// ================= API CALLS FOR SQLITE BACKEND =================

export async function fetchTripsFromApi(): Promise<{ trips: Trip[]; isConnected: boolean }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/trips`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data.trips)) {
      return { trips: data.trips, isConnected: true };
    }
    return { trips: [], isConnected: true };
  } catch (err) {
    console.warn('[Storage] API not reachable, falling back to local cache:', err);
    return { trips: loadTripsFromStorage(), isConnected: false };
  }
}

export async function saveTripsToApi(
  trips: Omit<Trip, 'id' | 'createdAt'> | Array<Omit<Trip, 'id' | 'createdAt'>> | Trip | Trip[]
): Promise<Trip[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trips),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.trips || null;
  } catch (err) {
    console.warn('[Storage] Failed to save trip to API:', err);
    return null;
  }
}

export async function updateTripOnApi(
  id: string,
  trip: Partial<Trip>
): Promise<Trip[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/trips/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.trips || null;
  } catch (err) {
    console.warn('[Storage] Failed to update trip on API:', err);
    return null;
  }
}

export async function deleteTripFromApi(id: string): Promise<Trip[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/trips/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.trips || null;
  } catch (err) {
    console.warn('[Storage] Failed to delete trip on API:', err);
    return null;
  }
}

export async function purgeDemosOnApi(): Promise<Trip[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/trips/purge-demos`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.trips || null;
  } catch (err) {
    return null;
  }
}

export async function purgeAllOnApi(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/trips/purge-all`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
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
