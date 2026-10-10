const getApiBase = () => {
  // Use casting to bypass strict ImportMeta check
  const env = (import.meta as any).env;
  let baseUrl = env?.VITE_API_BASE_URL || '/api';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api')) baseUrl += '/api';
  return baseUrl;
};

const API_BASE = getApiBase();

export interface UserData {
  name: string;
  plants: any[];
  xp: number;
  offline?: boolean;
}

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

class DataService {
  async login(name: string): Promise<UserData> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await readJson(response);
    return {
      name: typeof data.name === 'string' && data.name.trim() ? data.name : name,
      plants: Array.isArray(data.plants) ? data.plants : [],
      xp: typeof data.xp === 'number' ? data.xp : 0,
      offline: !!data.offline
    };
  }

  async syncUserData(name: string, plants: any[], xp?: number): Promise<UserData> {
    const response = await fetch(`${API_BASE}/user/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, plants, xp })
    });
    return readJson(response);
  }

  async getUserData(name: string): Promise<UserData> {
    const response = await fetch(`${API_BASE}/user/${encodeURIComponent(name)}`);
    return readJson(response);
  }
}

export const dataService = new DataService();
