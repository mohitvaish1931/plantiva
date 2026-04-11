
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
}

class DataService {
  async login(name: string): Promise<UserData> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return await response.json();
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  async syncUserData(name: string, plants: any[], xp: number): Promise<UserData> {
    try {
      const response = await fetch(`${API_BASE}/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, plants, xp })
      });
      return await response.json();
    } catch (err) {
      console.error('Sync error:', err);
      throw err;
    }
  }

  async getUserData(name: string): Promise<UserData> {
    try {
      const response = await fetch(`${API_BASE}/user/${name}`);
      return await response.json();
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  }
}

export const dataService = new DataService();
