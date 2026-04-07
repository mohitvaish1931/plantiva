
export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  aqi: number;
  aqiStatus: string;
}

class WeatherService {
  private apiKey: string = "edb4ba2f1f6ed107427ac3e158f136c0";
  private weatherBaseUrl: string = "https://api.openweathermap.org/data/2.5/weather";
  private airPollutionBaseUrl: string = "https://api.openweathermap.org/data/2.5/air_pollution";

  async getWeatherDataByCoords(lat: number, lon: number): Promise<WeatherData> {
    try {
      // Fetch Weather
      const weatherRes = await fetch(`${this.weatherBaseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
      const weatherData = await weatherRes.json();

      // Fetch AQI
      const aqiRes = await fetch(`${this.airPollutionBaseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`);
      const aqiData = await aqiRes.json();

      const aqiValue = aqiData.list[0].main.aqi;
      const aqiMap: { [key: number]: string } = {
        1: "Good",
        2: "Fair",
        3: "Moderate",
        4: "Poor",
        5: "Very Poor"
      };

      return {
        city: weatherData.name,
        temp: Math.round(weatherData.main.temp),
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        aqi: aqiValue,
        aqiStatus: aqiMap[aqiValue] || "Unknown"
      };
    } catch (error) {
      console.error("Error fetching weather/AQI data:", error);
      throw error;
    }
  }

  async getWeatherDataByCity(city: string): Promise<WeatherData> {
    try {
      const weatherRes = await fetch(`${this.weatherBaseUrl}?q=${city}&appid=${this.apiKey}&units=metric`);
      const weatherData = await weatherRes.json();
      
      const { lat, lon } = weatherData.coord;
      return this.getWeatherDataByCoords(lat, lon);
    } catch (error) {
      console.error("Error fetching weather data by city:", error);
      throw error;
    }
  }
}

export const weatherService = new WeatherService();
