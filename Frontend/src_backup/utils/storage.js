const TRIPS_KEY = 'yatrago.trips.v1';

export function readTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeTrips(trips) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
