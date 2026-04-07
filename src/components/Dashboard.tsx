import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Wind, 
  Droplets, 
  Thermometer, 
  Leaf, 
  Camera, 
  Bell, 
  Plus, 
  User as UserIcon,
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';
import PlantMap from './PlantMap';

interface DashboardProps {
  onStartChat: (plant?: any) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartChat, onLogout }) => {
  const [userName, setUserName] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState<any[]>([]);

  useEffect(() => {
    const savedName = localStorage.getItem('learnerbot_username') || 'Gardener';
    setUserName(savedName);

    // Initialize plants from local storage
    const savedPlants = JSON.parse(localStorage.getItem('learnerbot_plants') || '[]');
    setPlants(savedPlants);

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const data = await weatherService.getWeatherDataByCoords(lat, lon);
        setWeather(data);
        localStorage.setItem('learnerbot_weather', JSON.stringify(data));
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchByIP = async () => {
      try {
        // Simple IP location service
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = data.latitude;
          const lon = data.longitude;
          setCoords({ lat, lon });
          fetchWeather(lat, lon);
        } else {
          throw new Error("IP Geolocation failed");
        }
      } catch (err) {
        console.error("IP Geoloc failed, fallback to London", err);
        setCoords({ lat: 51.505, lon: -0.09 });
        weatherService.getWeatherDataByCity('London').then(data => {
          setWeather(data);
          localStorage.setItem('learnerbot_weather', JSON.stringify(data));
          setLoading(false);
        });
      }
    };

    // Get location and weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lon: longitude });
          fetchWeather(latitude, longitude);
        },
        () => {
          fetchByIP();
        },
        { timeout: 5000 }
      );
    } else {
      fetchByIP();
    }
  }, []);


  const getAqiColor = (status: string) => {
    switch (status) {
      case 'Good': return 'text-emerald-400';
      case 'Fair': return 'text-yellow-300';
      case 'Moderate': return 'text-orange-400';
      case 'Poor': return 'text-red-400';
      case 'Very Poor': return 'text-purple-400';
      default: return 'text-white/60';
    }
  };

  const getDynamicAlerts = () => {
    const alerts = [];
    
    // Weather-based alerts
    if (weather) {
      if (weather.temp > 30) {
        alerts.push({
          title: "Heat Stress Alert",
          desc: `Current temp is ${weather.temp}°C. Increase watering for outdoor plants.`,
          icon: <Thermometer className="w-5 h-5 text-orange-400" />,
          color: "orange"
        });
      } else if (weather.temp < 10) {
        alerts.push({
          title: "Frost Warning",
          desc: "Cold temperatures detected. Protect sensitive plants from frost.",
          icon: <Wind className="w-5 h-5 text-blue-400" />,
          color: "blue"
        });
      }

      if (weather.humidity < 40) {
        alerts.push({
          title: "Low Humidity",
          desc: `Air is dry (${weather.humidity}%). Consider misting leaves or using a humidifier.`,
          icon: <Droplets className="w-5 h-5 text-sky-400" />,
          color: "sky"
        });
      }

      if (weather.aqi > 2) {
        alerts.push({
          title: "Air Pollution Level",
          desc: "Moderate to high pollution can affect plant stomata. Monitor leaf health.",
          icon: <Info className="w-5 h-5 text-yellow-400" />,
          color: "yellow"
        });
      }
    }

    // Collection-based alerts
    if (plants.length === 0) {
      alerts.push({
          title: "No Scans Found",
          desc: "Identify your first plant to start building your AI collection.",
          icon: <Plus className="w-5 h-5 text-emerald-400" />,
          color: "emerald"
      });
    } else {
      alerts.push({
          title: "Active Collection",
          desc: `${plants.length} plant models are being monitored and synced.`,
          icon: <Leaf className="w-5 h-5 text-emerald-400" />,
          color: "emerald"
      });
    }

    return alerts;
  };

  const activeAlerts = getDynamicAlerts();

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white pb-20 custom-scrollbar overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-green-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white to-emerald-300 bg-clip-text text-transparent">
                Plantiva
              </span>
            </h1>
          </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogout}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors border border-white/10 rounded-lg"
              >
                Logout
              </button>
              <button className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors relative">
                <Bell className="w-5 h-5 text-emerald-400" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0f0d]" />
              </button>
              <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                <p className="text-sm font-medium hidden sm:block">{userName}</p>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
        </header>

        {/* Hero Tagline Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-gradient-to-br from-emerald-900/40 to-green-900/20 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" />
              Next-Gen Intelligence
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Smart Care. Sustainable Growth - Where AI Grows the Future.
            </h2>
            <p className="text-lg text-emerald-100/70 leading-relaxed italic">
              "Integrating context-aware and predictive AI, delivering personalized and explainable plant care recommendations."
            </p>


          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Weather & AQI */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-white/50 text-sm font-medium uppercase tracking-wider">Local Environment</p>
                  <h3 className="text-xl font-bold mt-1 flex items-center gap-2">
                    {loading ? 'Locating...' : weather?.city || 'Weather Details'}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Cloud className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-white/10 rounded-2xl w-2/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white/10 rounded-2xl" />
                    <div className="h-20 bg-white/10 rounded-2xl" />
                  </div>
                </div>
              ) : weather ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-black">{weather.temp}°</div>
                    <div>
                      <p className="text-lg font-medium capitalize">{weather.description}</p>
                      <p className="text-white/40 text-sm">Humidity: {weather.humidity}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase mb-1">
                        <Wind className="w-3 h-3" />
                        Air Quality
                      </div>
                      <div className={`text-xl font-black ${getAqiColor(weather.aqiStatus)}`}>
                        {weather.aqiStatus}
                      </div>
                      <p className="text-[10px] text-white/30 mt-1">Level {weather.aqi} Index</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase mb-1">
                        <Thermometer className="w-3 h-3" />
                        Wind
                      </div>
                      <div className="text-xl font-black">{weather.windSpeed}</div>
                      <p className="text-[10px] text-white/30 mt-1">Meter/Sec</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-200/80 leading-relaxed">
                        {weather.aqi <= 2 
                          ? "Perfect conditions for outdoor plants. Air quality is healthy for respiration and growth."
                          : "Moderate air pollution detected. Consider moving sensitive plants indoors."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-white/30">
                  <p>Unable to load weather data.</p>
                </div>
              )}
            </motion.div>

            {/* Map Widget */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md overflow-hidden relative shadow-2xl"
            >
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Micro-Climate Intelligence</h3>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/5 h-[300px]">
                {coords ? (
                  <PlantMap lat={coords.lat} lon={coords.lon} />
                ) : (
                  <div className="h-full w-full bg-white/5 animate-pulse flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Calibrating Geolocation...</p>
                  </div>
                )}
              </div>
              <div className="mt-3 px-2 flex justify-between items-center">
                <p className="text-[9px] text-white/30 italic">Live OpenStreetMap Feed</p>
                <div className="flex gap-3">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[9px] text-white/40 font-medium">Your Hub</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-[9px] text-white/40 font-medium">Analysis Active</span>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats/Alerts */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-400" />
                Active Alerts
              </h3>
              <div className="space-y-4">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className={`p-4 bg-${alert.color}-500/10 border border-${alert.color}-500/20 rounded-2xl flex gap-4 backdrop-blur-sm`}
                    >
                      <div className="shrink-0 mt-1">{alert.icon}</div>
                      <div>
                        <p className={`text-sm font-bold text-${alert.color}-200`}>{alert.title}</p>
                        <p className={`text-[11px] text-${alert.color}-100/60 leading-relaxed`}>{alert.desc}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6 text-white/30 text-sm">
                    No active threats detected.
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Dashboard Actions & Collection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartChat}
                className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/10 flex flex-col items-center justify-center gap-3 border border-white/20 group"
              >
                <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black uppercase tracking-tighter">Scan Any Plant</p>
                  <p className="text-sm text-white/70">Instant AI Diagnosis</p>
                </div>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartChat}
                className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <div className="p-4 bg-emerald-500/10 rounded-2xl">
                  <Search className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black uppercase tracking-tighter">Expert Chat</p>
                  <p className="text-sm text-white/50">Ask about care</p>
                </div>
              </motion.button>
            </div>

            {/* My Plants Collection */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">My Collection</h3>
                  <p className="text-white/40 text-sm">Stored healthy and recovering plants</p>
                </div>
                <button className="text-emerald-400 text-sm font-bold flex items-center gap-1 hover:underline">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {plants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plants.map((plant, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onStartChat(plant)}
                      className="bg-white/5 border border-white/10 rounded-[1.5rem] p-5 flex gap-5 items-center cursor-pointer transition-all duration-300"
                    >
                      <div className="w-20 h-20 bg-emerald-900/30 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5">
                        {plant.image ? (
                          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                        ) : (
                          <Leaf className="w-10 h-10 text-emerald-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{plant.name || 'Unnamed Plant'}</p>
                        <p className="text-xs text-white/40">{plant.diagnosis || 'Healthy'}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[85%]" />
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">85%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full mb-4">
                    <Leaf className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/30 font-medium">Your plant collection is empty.</p>
                  <button 
                    onClick={onStartChat}
                    className="mt-4 text-emerald-400 font-bold hover:underline"
                  >
                    Identify your first plant
                  </button>
                </div>
              )}
            </motion.div>

            {/* Explainable AI Banner */}
            <div className="bg-gradient-to-r from-blue-900/20 to-emerald-900/20 border border-blue-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 bg-blue-500/20 rounded-2xl">
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-blue-200">Context-Aware Protection</h4>
                <p className="text-sm text-blue-100/60 leading-relaxed">
                  Our system analyzes micro-climate data and predictive modeling to warn you about potential pest outbreaks in your area before they reach your garden. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
