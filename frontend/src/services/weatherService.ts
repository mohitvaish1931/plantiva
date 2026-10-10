
export interface ForecastPoint {
  time: string;      // e.g. "15:00"
  timestamp: number; // ms
  temp: number;
  humidity: number;
  pop: number;       // chance of rain, 0-100
  description: string;
}

export interface WeatherData {
  city: string;
  area?: string;
  country?: string;
  lat: number;
  lon: number;
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number; // km/h
  aqi: number;
  aqiStatus: string;
  uvIndex: number;
  sunImpact: string;
  precipitation: number; // chance of rain in the next 3h, 0-100
  forecast: ForecastPoint[];
  updatedAt: number;
}

export type LocationSource = 'gps' | 'ip' | 'saved' | 'default';

export interface ResolvedLocation {
  lat: number;
  lon: number;
  source: LocationSource;
  city?: string;
}

const AQI_LABELS: Record<number, string> = {
  1: "Good",
  2: "Fair",
  3: "Moderate",
  4: "Poor",
  5: "Very Poor"
};

const cleanPlaceName = (name: string) =>
  name.replace(/\s+(Municipal Corporation|Municipal Council|Nagar Nigam|Nagar Palika|Corporation|District|Tehsil|Taluka)$/i, '').trim();

class WeatherService {
  private apiKey: string = "edb4ba2f1f6ed107427ac3e158f136c0";
  private baseUrl: string = "https://api.openweathermap.org";

  private url(path: string, params: Record<string, string | number>) {
    const query = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), appid: this.apiKey });
    return `${this.baseUrl}${path}?${query}`;
  }

  private async getJson(path: string, params: Record<string, string | number>) {
    const res = await fetch(this.url(path, params));
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return res.json();
  }

  async getWeatherDataByCoords(lat: number, lon: number): Promise<WeatherData> {
    // Current weather is required; everything else degrades gracefully.
    const [weatherData, aqiData, uvData, forecastData, placeData] = await Promise.all([
      this.getJson('/data/2.5/weather', { lat, lon, units: 'metric' }),
      this.getJson('/data/2.5/air_pollution', { lat, lon }).catch(() => null),
      this.getJson('/data/2.5/uvi', { lat, lon }).catch(() => null),
      this.getJson('/data/2.5/forecast', { lat, lon, units: 'metric', cnt: 9 }).catch(() => null),
      this.getJson('/geo/1.0/reverse', { lat, lon, limit: 1 }).catch(() => null),
    ]);

    const aqiValue: number = aqiData?.list?.[0]?.main?.aqi ?? 0;
    const uvValue: number = Math.round((uvData?.value ?? 0) * 10) / 10;

    const forecast: ForecastPoint[] = (forecastData?.list ?? []).map((item: any) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: item.dt * 1000,
      temp: Math.round(item.main?.temp ?? 0),
      humidity: item.main?.humidity ?? 0,
      pop: Math.round((item.pop ?? 0) * 100),
      description: item.weather?.[0]?.description ?? ''
    }));

    const place = placeData?.[0];
    const area: string | undefined = weatherData.name || undefined;
    const city = place?.name ? cleanPlaceName(place.name) : (area || 'Your Area');

    return {
      city,
      area: area && area !== city ? area : undefined,
      country: place?.country || weatherData.sys?.country,
      lat,
      lon,
      temp: Math.round(weatherData.main?.temp ?? 0),
      feelsLike: Math.round(weatherData.main?.feels_like ?? weatherData.main?.temp ?? 0),
      description: weatherData.weather?.[0]?.description || "Clear",
      humidity: weatherData.main?.humidity ?? 0,
      // OpenWeather returns m/s in metric units
      windSpeed: Math.round((weatherData.wind?.speed ?? 0) * 3.6),
      aqi: aqiValue,
      aqiStatus: AQI_LABELS[aqiValue] || "Unknown",
      uvIndex: uvValue,
      sunImpact: uvValue >= 8 ? 'Very High' : uvValue >= 6 ? 'High' : uvValue >= 3 ? 'Moderate' : 'Low',
      precipitation: forecast[0]?.pop ?? 0,
      forecast,
      updatedAt: Date.now()
    };
  }

  async getWeatherDataByCity(city: string): Promise<WeatherData> {
    const weatherData = await this.getJson('/data/2.5/weather', { q: city, units: 'metric' });
    const { lat, lon } = weatherData.coord;
    return this.getWeatherDataByCoords(lat, lon);
  }

  /** Approximate location from the user's IP, used when GPS is denied or unavailable. */
  async getIpLocation(): Promise<ResolvedLocation> {
    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!res.ok) throw new Error(`geojs ${res.status}`);
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon, source: 'ip', city: data.city };
      throw new Error('geojs returned no coordinates');
    } catch {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (!data.success) throw new Error('IP location unavailable');
      return { lat: data.latitude, lon: data.longitude, source: 'ip', city: data.city };
    }
  }
}

export const weatherService = new WeatherService();
