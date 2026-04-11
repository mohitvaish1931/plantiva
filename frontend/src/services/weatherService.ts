
export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  aqi: number;
  aqiStatus: string;
  uvIndex: number;
  sunImpact: string;
}

class WeatherService {
  private apiKey: string = "edb4ba2f1f6ed107427ac3e158f136c0";
  private weatherBaseUrl: string = "https://api.openweathermap.org/data/2.5/weather";
  private airPollutionBaseUrl: string = "https://api.openweathermap.org/data/2.5/air_pollution";

  async getWeatherDataByCoords(lat: number, lon: number): Promise<WeatherData> {
    try {
      // 1. Fetch Weather (Main)
      const weatherRes = await fetch(`${this.weatherBaseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
      if (!weatherRes.ok) throw new Error(`Weather API failed: ${weatherRes.status}`);
      const weatherData = await weatherRes.json();

      // 2. Fetch AQI
      let aqiStatus = "Fair";
      let aqiValue = 2;
      try {
        const aqiRes = await fetch(`${this.airPollutionBaseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`);
        if (aqiRes.ok) {
          const aqiData = await aqiRes.json();
          aqiValue = aqiData.list[0].main.aqi;
          const aqiMap: { [key: number]: string } = {
            1: "Good",
            2: "Fair",
            3: "Moderate",
            4: "Poor",
            5: "Very Poor"
          };
          aqiStatus = aqiMap[aqiValue] || "Fair";
        }
      } catch (e) {
        console.warn("AQI fetch failed, using default", e);
      }

      // 3. Fetch UV Index (Safe Fallback)
      let uvValue = 0;
      try {
        const uvRes = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${this.apiKey}`);
        if (uvRes.ok) {
          const uvData = await uvRes.json();
          uvValue = uvData.value || 0;
        }
      } catch (e) {
        console.warn("UV fetch failed, using default", e);
      }

      return {
        city: weatherData.name || "Your Area",
        temp: Math.round(weatherData.main?.temp ?? 20),
        description: weatherData.weather?.[0]?.description || "Partly Cloudy",
        humidity: weatherData.main?.humidity ?? 50,
        windSpeed: weatherData.wind?.speed ?? 0,
        aqi: aqiValue,
        aqiStatus: aqiStatus,
        uvIndex: uvValue,
        sunImpact: uvValue > 7 ? 'Vhigh' : uvValue > 5 ? 'High' : uvValue > 3 ? 'Moderate' : 'Low'
      };
    } catch (error) {
      console.error("Error fetching weather/AQI/UV data:", error);
      throw error;
    }
  }

  async getWeatherDataByCity(city: string): Promise<WeatherData> {
    try {
      const weatherRes = await fetch(`${this.weatherBaseUrl}?q=${city}&appid=${this.apiKey}&units=metric`);
      if (!weatherRes.ok) throw new Error(`Weather API by city failed: ${weatherRes.status}`);
      const weatherData = await weatherRes.json();
      
      const { lat, lon } = weatherData.coord;
      return this.getWeatherDataByCoords(lat, lon);
    } catch (error) {
      console.error("Error fetching weather data by city:", error);
      // Fallback to a default city if specific city fails
      if (city !== 'London') return this.getWeatherDataByCity('London');
      throw error;
    }
  }
}

export const weatherService = new WeatherService();
