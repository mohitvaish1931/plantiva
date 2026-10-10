import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { Plant } from '../types';
import { weatherService, WeatherData, LocationSource, ResolvedLocation } from '../services/weatherService';
import { dataService } from '../services/dataService';
import { progressService } from '../services/progressService';
import { STORAGE_KEYS, getStoredUserName, clearUserData, readJson, normalizePlant, mergePlants } from '../services/session';
import { dayKey } from '../utils';

export type CareTask = {
  id: string;
  plantId: string;
  plantName: string;
  type: 'water' | 'fertilize' | 'prune' | 'sunlight';
  dueDate: string;
  isCompleted: boolean;
};

export type Alert = {
  id: number;
  type: 'warning' | 'critical' | 'resolved';
  title: string;
  description: string;
  timestamp: string;
  details: string;
  metrics: { label: string; value: string; icon: any }[];
};

interface DataContextType {
  userName: string;
  plants: Plant[];
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  locationSource: LocationSource | null;
  /** Short description of place + weather, sent to the AI with every question. */
  locationContext: string;
  tasks: CareTask[];
  alerts: Alert[];
  xp: number;
  loading: boolean;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  refreshWeather: () => Promise<void>;
  setUserName: (name: string) => void;
  logout: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const WEATHER_CACHE_MS = 15 * 60 * 1000;
const SAVED_LOCATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SavedLocation = { lat: number; lon: number; source: LocationSource; savedAt: number };

function getGpsPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

/** GPS first, then the last GPS fix we saved, then an IP-based estimate. */
async function resolveLocation(): Promise<ResolvedLocation | null> {
  try {
    const { lat, lon } = await getGpsPosition();
    return { lat, lon, source: 'gps' };
  } catch {
    const saved = readJson<SavedLocation | null>(STORAGE_KEYS.location, null);
    if (saved && saved.source === 'gps' && Date.now() - saved.savedAt < SAVED_LOCATION_MAX_AGE_MS) {
      return { lat: saved.lat, lon: saved.lon, source: 'saved' };
    }
    try {
      return await weatherService.getIpLocation();
    } catch {
      return null;
    }
  }
}

function buildTasks(plants: Plant[], done: Record<string, string>): CareTask[] {
  const today = dayKey();
  const tomorrow = dayKey(new Date(Date.now() + 86400000));
  const tasks: CareTask[] = [];

  // Only the latest scan of each plant name produces tasks, so rescans don't duplicate them.
  const seen = new Set<string>();
  const latest = plants.filter(p => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  latest.forEach(plant => {
    const text = `${plant.diagnosis || ''} ${plant.disease || ''}`.toLowerCase();
    const add = (type: CareTask['type'], dueDay: string) => {
      const id = `${plant.id}-${type}-${dueDay}`;
      tasks.push({
        id,
        plantId: plant.id,
        plantName: plant.name,
        type,
        dueDate: dueDay === today ? 'Today' : 'Tomorrow',
        isCompleted: !!done[id],
      });
    };

    const before = tasks.length;
    if (plant.healthScore < 75 || /nutrient|fertili[sz]|yellowing|chlorosis/.test(text)) add('fertilize', today);
    if (/dry|wilt|water|underwater|thirst/.test(text) || plant.healthScore >= 85) add('water', today);
    if (/prune|dead|dying|blight|rot|remove (the )?(affected|infected)/.test(text) || plant.healthScore < 60) add('prune', tomorrow);
    if (tasks.length === before) add('sunlight', tomorrow);
  });

  return tasks;
}

function buildAlerts(weather: WeatherData | null, plants: Plant[]): Alert[] {
  const alerts: Alert[] = [];
  if (plants.length === 0) return alerts;
  let id = 1;

  if (weather) {
    if (weather.temp > 35) {
      alerts.push({
        id: id++,
        type: 'critical',
        title: 'Extreme Heat Warning',
        description: `It is ${weather.temp}°C in ${weather.city}. Move sensitive plants out of direct sun.`,
        timestamp: 'Just now',
        details: 'Prolonged exposure to temperatures above 32°C can cause leaf scorch and wilting. Water early in the morning and provide shade in the afternoon.',
        metrics: [
          { label: 'Temperature', value: `${weather.temp}°C`, icon: null },
          { label: 'Condition', value: weather.description, icon: null }
        ]
      });
    }

    if (weather.humidity < 40) {
      alerts.push({
        id: id++,
        type: 'warning',
        title: 'Low Humidity Detected',
        description: `Humidity in ${weather.city} is ${weather.humidity}%. Tropical plants are at risk.`,
        timestamp: 'Just now',
        details: 'Low humidity dries out leaf edges. Group plants together, use a pebble tray, or mist leaves in the morning.',
        metrics: [
          { label: 'Current', value: `${weather.humidity}%`, icon: null },
          { label: 'Target', value: '50-60%', icon: null }
        ]
      });
    }

    if (weather.uvIndex >= 8) {
      alerts.push({
        id: id++,
        type: 'warning',
        title: 'Very High UV Today',
        description: `UV index is ${weather.uvIndex}. Keep shade-loving plants away from direct midday sun.`,
        timestamp: 'Just now',
        details: 'Strong UV can bleach and burn leaves of indoor and shade plants within hours.',
        metrics: [
          { label: 'UV Index', value: String(weather.uvIndex), icon: null },
          { label: 'Risk', value: weather.sunImpact, icon: null }
        ]
      });
    }
  }

  plants.forEach(plant => {
    if (plant.healthScore < 70) {
      alerts.push({
        id: id++,
        type: 'critical',
        title: `Health Alert: ${plant.name}`,
        description: `Health score is ${plant.healthScore}%${plant.disease && plant.disease !== 'None' ? ` (${plant.disease})` : ''}. Action needed.`,
        timestamp: new Date(plant.addedAt).toLocaleDateString(),
        details: `Latest scan of ${plant.name}: "${(plant.diagnosis || '').substring(0, 120)}..."`,
        metrics: [
          { label: 'Current Health', value: `${plant.healthScore}%`, icon: null },
          { label: 'Status', value: 'Critical', icon: null }
        ]
      });
    } else if (plant.healthScore <= 85) {
      alerts.push({
        id: id++,
        type: 'warning',
        title: `Monitor: ${plant.name}`,
        description: `Health score is ${plant.healthScore}%. Minor care adjustments suggested.`,
        timestamp: new Date(plant.addedAt).toLocaleDateString(),
        details: 'The plant is doing okay, but some signs of stress were detected during the last scan.',
        metrics: [
          { label: 'Current Health', value: `${plant.healthScore}%`, icon: null },
          { label: 'Trend', value: 'Stable', icon: null }
        ]
      });
    }
  });

  return alerts;
}

function buildLocationContext(weather: WeatherData | null, source: LocationSource | null): string {
  if (!weather) return '';
  const place = [weather.area, weather.city, weather.country].filter(Boolean).join(', ');
  const precision = source === 'ip' ? ' (approximate, from IP)' : '';
  return `Location: ${place}${precision}. Weather now: ${weather.temp}°C (feels ${weather.feelsLike}°C), ${weather.description}, humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h, UV index ${weather.uvIndex} (${weather.sunImpact}), air quality ${weather.aqiStatus}, chance of rain ${weather.precipitation}%. Local date: ${new Date().toDateString()}.`;
}

/** Caps what we persist; plant images are already small thumbnails (see ScanPlantPage). */
function forStorage(plants: Plant[]): Plant[] {
  return plants.slice(0, 50);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string>(() => getStoredUserName() || 'Plant Lover');
  const [plants, setPlants] = useState<Plant[]>(() =>
    readJson<any[]>(STORAGE_KEYS.plants, []).map(normalizePlant)
  );
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    const cached = readJson<WeatherData | null>(STORAGE_KEYS.weather, null);
    return cached && Array.isArray(cached.forecast) ? cached : null;
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(
    () => readJson<SavedLocation | null>(STORAGE_KEYS.location, null)?.source ?? null
  );
  const [doneTasks, setDoneTasks] = useState<Record<string, string>>(() => readJson(STORAGE_KEYS.tasksDone, {}));
  const [xp] = useState<number>(() => progressService.getProgress().xp);
  const [loading, setLoading] = useState(true);
  const syncTimer = useRef<number | null>(null);

  const refreshWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const location = await resolveLocation();
      if (!location) throw new Error('Could not detect your location. Allow location access and tap refresh.');

      const data = await weatherService.getWeatherDataByCoords(location.lat, location.lon);
      setWeather(data);
      setLocationSource(location.source);
      try {
        localStorage.setItem(STORAGE_KEYS.weather, JSON.stringify(data));
        if (location.source !== 'saved') {
          const saved: SavedLocation = { lat: location.lat, lon: location.lon, source: location.source, savedAt: Date.now() };
          localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(saved));
        }
      } catch { /* storage full or unavailable */ }
    } catch (e) {
      console.error('Weather refresh failed', e);
      setWeatherError(e instanceof Error ? e.message : 'Weather unavailable');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedFresh = weather && Date.now() - weather.updatedAt < WEATHER_CACHE_MS;
    if (!cachedFresh) refreshWeather();

    // Pull plants saved on the server (e.g. from another device) and merge them in.
    const name = getStoredUserName();
    if (name) {
      dataService.getUserData(name)
        .then(user => {
          const remote = (user.plants || []).map(normalizePlant);
          if (remote.length) setPlants(local => mergePlants(local, remote));
        })
        .catch(() => { /* offline or database down; local data is still shown */ })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist plants locally and (debounced) to the server whenever they change.
  useEffect(() => {
    const toSave = forStorage(plants);
    try {
      localStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(toSave));
    } catch {
      try {
        localStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(toSave.map((p, i) => (i < 10 ? p : { ...p, image: null }))));
      } catch (e) {
        console.error('Could not save plants', e);
      }
    }

    const name = getStoredUserName();
    if (!name || loading) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      dataService.syncUserData(name, toSave).catch(() => { /* will retry on next change */ });
    }, 1500);
  }, [plants, loading]);

  useEffect(() => {
    try {
      // Keep two weeks of completions so the object doesn't grow forever.
      const cutoff = dayKey(new Date(Date.now() - 14 * 86400000));
      const pruned = Object.fromEntries(Object.entries(doneTasks).filter(([, day]) => day >= cutoff));
      localStorage.setItem(STORAGE_KEYS.tasksDone, JSON.stringify(pruned));
    } catch { /* ignore */ }
  }, [doneTasks]);

  const tasks = useMemo(() => buildTasks(plants, doneTasks), [plants, doneTasks]);
  const alerts = useMemo(() => buildAlerts(weather, plants), [weather, plants]);
  const locationContext = useMemo(() => buildLocationContext(weather, locationSource), [weather, locationSource]);

  const addPlant = useCallback((plant: Plant) => {
    setPlants(prev => [plant, ...prev]);
  }, []);

  const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePlant = useCallback((id: string) => {
    setPlants(prev => prev.filter(p => p.id !== id));
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    setDoneTasks(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = dayKey();
      return next;
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try { localStorage.setItem(STORAGE_KEYS.userName, trimmed); } catch { /* ignore */ }
    setUserNameState(trimmed);
  }, []);

  const logout = useCallback(() => {
    clearUserData();
    window.location.href = '/';
  }, []);

  return (
    <DataContext.Provider value={{
      userName,
      plants,
      weather,
      weatherLoading,
      weatherError,
      locationSource,
      locationContext,
      tasks,
      alerts,
      xp,
      loading,
      addPlant,
      updatePlant,
      deletePlant,
      toggleTaskComplete,
      refreshWeather,
      setUserName,
      logout
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
