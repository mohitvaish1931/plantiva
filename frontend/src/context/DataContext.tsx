import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Plant, UserProgress } from '../types';
import { weatherService, WeatherData } from '../services/weatherService';
import { dataService } from '../services/dataService';
import { progressService } from '../services/progressService';

export type CareTask = {
  id: number;
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
  tasks: CareTask[];
  alerts: Alert[];
  xp: number;
  loading: boolean;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  toggleTaskComplete: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>('Learning Champion');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [xp, setXp] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    const initData = async () => {
      setLoading(true);
      try {
        // 1. Get user name
        const storedName = localStorage.getItem('learnerbot_username') || 'Learning Champion';
        setUserName(storedName);

        // 2. Load Plants
        const storedPlants: Plant[] = JSON.parse(localStorage.getItem('learnerbot_plants') || '[]');
        setPlants(storedPlants);

        // 3. Load Progress
        setXp(progressService.getProgress().xp);

        // 4. Fetch Weather
        // Try getting geolocation, fallback to London
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const weatherData = await weatherService.getWeatherDataByCoords(
                  position.coords.latitude, 
                  position.coords.longitude
                );
                setWeather(weatherData);
                generateDynamicAlerts(weatherData, storedPlants);
              } catch (e) {
                fallbackWeather(storedPlants);
              }
            },
            () => fallbackWeather(storedPlants)
          );
        } else {
          fallbackWeather(storedPlants);
        }

        // 5. Generate Tasks based on actual plants
        generateDynamicTasks(storedPlants);

      } catch (e) {
        console.error("Failed to initialize DataContext", e);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const fallbackWeather = async (currentPlants: Plant[]) => {
    try {
      const weatherData = await weatherService.getWeatherDataByCity('London');
      setWeather(weatherData);
      generateDynamicAlerts(weatherData, currentPlants);
    } catch (e) {
      console.error("Weather fallback failed", e);
    }
  };

  const generateDynamicTasks = (currentPlants: Plant[]) => {
    if (currentPlants.length === 0) {
      setTasks([]);
      return;
    }
    
    let newTasks: CareTask[] = [];
    let taskIdCounter = Date.now();

    currentPlants.forEach(plant => {
      const lowerDiagnosis = (plant.diagnosis || '').toLowerCase();
      
      // Smart Task Generation based on condition
      if (plant.healthScore < 75 || lowerDiagnosis.includes('nutrient') || lowerDiagnosis.includes('fertilizer')) {
        newTasks.push({
          id: taskIdCounter++,
          plantName: plant.name,
          type: 'fertilize',
          dueDate: 'Today',
          isCompleted: false
        });
      }
      
      if (lowerDiagnosis.includes('dry') || lowerDiagnosis.includes('water') || plant.healthScore >= 90) {
        newTasks.push({
          id: taskIdCounter++,
          plantName: plant.name,
          type: 'water',
          dueDate: plant.healthScore >= 90 ? 'In 2 days' : 'Today',
          isCompleted: false
        });
      }

      if (lowerDiagnosis.includes('prune') || lowerDiagnosis.includes('dead') || plant.healthScore < 60) {
        newTasks.push({
          id: taskIdCounter++,
          plantName: plant.name,
          type: 'prune',
          dueDate: 'Tomorrow',
          isCompleted: false
        });
      }

      // Default task if nothing matched
      if (newTasks.filter(t => t.plantName === plant.name).length === 0) {
        newTasks.push({
          id: taskIdCounter++,
          plantName: plant.name,
          type: 'sunlight',
          dueDate: 'Tomorrow',
          isCompleted: false
        });
      }
    });

    setTasks(newTasks);
  };

  const generateDynamicAlerts = (weatherData: WeatherData, currentPlants: Plant[]) => {
    const newAlerts: Alert[] = [];
    
    if (currentPlants.length === 0) {
      setAlerts([]);
      return;
    }

    // Weather Alerts
    if (weatherData.temp > 35) {
      newAlerts.push({
        id: Date.now(),
        type: 'critical',
        title: 'Extreme Heat Warning',
        description: `Temperatures expected to reach ${weatherData.temp}°C. Move sensitive plants indoors.`,
        timestamp: 'Just now',
        details: 'The micro-climate monitor has detected an incoming heatwave. Prolonged exposure to temperatures above 32°C can cause irreversible cellular damage.',
        metrics: [
          { label: 'Forecast', value: `${weatherData.temp}°C`, icon: null },
          { label: 'Condition', value: weatherData.description, icon: null }
        ]
      });
    }

    if (weatherData.humidity < 40) {
      newAlerts.push({
        id: Date.now() + 1,
        type: 'warning',
        title: 'Low Humidity Detected',
        description: `Indoor humidity is ${weatherData.humidity}%. Tropical plants at risk.`,
        timestamp: '1 hour ago',
        details: 'Continuous monitoring shows a sharp decline in ambient humidity. Consider activating a humidifier.',
        metrics: [
          { label: 'Current', value: `${weatherData.humidity}%`, icon: null },
          { label: 'Target', value: '55%', icon: null }
        ]
      });
    }

    // Plant Condition Predictive Alerts
    currentPlants.forEach((plant, index) => {
      if (plant.healthScore < 70) {
        newAlerts.push({
          id: Date.now() + 2 + index,
          type: 'critical',
          title: `Health Alert: ${plant.name}`,
          description: `Health score dropped to ${plant.healthScore}%. Immediate action required.`,
          timestamp: 'Just now',
          details: `Our predictive AI noticed a declining health trend for ${plant.name}. Based on the diagnosis "${plant.diagnosis?.substring(0, 50)}...", intervention is necessary.`,
          metrics: [
            { label: 'Current Health', value: `${plant.healthScore}%`, icon: null },
            { label: 'Status', value: 'Critical', icon: null }
          ]
        });
      } else if (plant.healthScore >= 70 && plant.healthScore <= 85) {
        newAlerts.push({
          id: Date.now() + 2 + index,
          type: 'warning',
          title: `Monitor: ${plant.name}`,
          description: `Health score is at ${plant.healthScore}%. Minor care adjustments suggested.`,
          timestamp: '2 hours ago',
          details: `The plant is doing okay, but some signs of stress were detected during the last scan.`,
          metrics: [
            { label: 'Current Health', value: `${plant.healthScore}%`, icon: null },
            { label: 'Trend', value: 'Stable', icon: null }
          ]
        });
      }
    });

    setAlerts(newAlerts);
  };

  const savePlantsToStorage = (plantsToSave: Plant[]) => {
    try {
      localStorage.setItem('learnerbot_plants', JSON.stringify(plantsToSave));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded, removing oldest plant images to make space...");
        let minimizedPlants = JSON.parse(JSON.stringify(plantsToSave));
        
        // Progressively remove images from oldest to newest until it fits
        for (let i = minimizedPlants.length - 1; i >= 0; i--) {
          if (minimizedPlants[i].image) {
            minimizedPlants[i].image = null;
            try {
              localStorage.setItem('learnerbot_plants', JSON.stringify(minimizedPlants));
              return; // Success!
            } catch (innerE) {
              continue; // Still too big, keep removing
            }
          }
        }
        
        // If all images are removed and it still fails, truncate the array
        try {
          localStorage.setItem('learnerbot_plants', JSON.stringify(minimizedPlants.slice(0, 20)));
        } catch (finalE) {
          console.error("Could not save plants even after minimization.", finalE);
        }
      } else {
        console.error("Error saving to localStorage", e);
      }
    }
  };

  const addPlant = (plant: Plant) => {
    const newPlants = [plant, ...plants];
    setPlants(newPlants);
    savePlantsToStorage(newPlants);
    generateDynamicTasks(newPlants);
    if (weather) generateDynamicAlerts(weather, newPlants);
  };

  const updatePlant = (id: string, updates: Partial<Plant>) => {
    const newPlants = plants.map(p => p.id === id ? { ...p, ...updates } : p);
    setPlants(newPlants);
    savePlantsToStorage(newPlants);
  };

  const deletePlant = (id: string) => {
    const newPlants = plants.filter(p => p.id !== id);
    setPlants(newPlants);
    savePlantsToStorage(newPlants);
    generateDynamicTasks(newPlants);
    if (weather) generateDynamicAlerts(weather, newPlants);
  };

  const toggleTaskComplete = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  return (
    <DataContext.Provider value={{
      userName,
      plants,
      weather,
      tasks,
      alerts,
      xp,
      loading,
      addPlant,
      updatePlant,
      deletePlant,
      toggleTaskComplete
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
