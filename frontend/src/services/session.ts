import type { Plant } from '../types';

export const STORAGE_KEYS = {
  userName: 'learnerbot_username',
  plants: 'learnerbot_plants',
  progress: 'learnerbot_progress',
  scanHistory: 'plantiva_scan_history',
  tasksDone: 'plantiva_tasks_done',
  location: 'plantiva_last_location',
  weather: 'plantiva_weather_cache',
} as const;

/** The saved name, ignoring junk like "undefined" left behind by the old login bug. */
export function getStoredUserName(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.userName)?.trim();
    if (!value || value === 'undefined' || value === 'null') return null;
    return value;
  } catch {
    return null;
  }
}

/** Removes everything that belongs to the current user (not location/weather caches). */
export function clearUserData() {
  [STORAGE_KEYS.userName, STORAGE_KEYS.plants, STORAGE_KEYS.progress, STORAGE_KEYS.scanHistory, STORAGE_KEYS.tasksDone]
    .forEach(key => {
      try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
    });
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Accepts plants saved by any older version of the app (or the old server schema). */
export function normalizePlant(raw: any, index = 0): Plant {
  const addedAt = raw?.addedAt || raw?.date || new Date().toISOString();
  const healthScore = Number.isFinite(Number(raw?.healthScore)) ? Math.round(Number(raw.healthScore)) : 75;
  return {
    id: String(raw?.id || raw?._id || `${new Date(addedAt).getTime()}-${index}`),
    name: raw?.name || 'Scanned Plant',
    species: raw?.species,
    image: raw?.image || null,
    healthScore,
    confidence: Number.isFinite(Number(raw?.confidence)) ? Number(raw.confidence) : null,
    disease: raw?.disease,
    status: raw?.status,
    scanMode: raw?.scanMode,
    diagnosis: raw?.diagnosis,
    treatment: raw?.treatment,
    lastWatered: raw?.lastWatered,
    addedAt,
    timeline: Array.isArray(raw?.timeline) ? raw.timeline : [],
  };
}

export function mergePlants(local: Plant[], remote: Plant[]): Plant[] {
  const byId = new Map<string, Plant>();
  [...remote, ...local].forEach(p => byId.set(p.id, { ...byId.get(p.id), ...p }));
  return [...byId.values()].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}
