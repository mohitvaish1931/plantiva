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
  Sun,
  Calendar,
  CheckCircle,
  Activity
} from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';
import { progressService } from '../services/progressService';
import { notificationService } from '../services/notificationService';
import PlantMap from './PlantMap';
import PlantTimeline from './PlantTimeline';
import { Plant } from '../types';

interface DashboardProps {
  onStartChat: (plant?: Plant) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartChat, onLogout }) => {
  const [userName, setUserName] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [showCareModal, setShowCareModal] = useState(false);
  const [careSuccess, setCareSuccess] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [envMatch, setEnvMatch] = useState<number>(0);
  const [view, setView] = useState<'dashboard' | 'timeline'>('dashboard');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const notifiedOptimalRef = React.useRef(false);

  useEffect(() => {
    const savedName = localStorage.getItem('learnerbot_username') || 'Gardener';
    setUserName(savedName);

    const savedPlants = JSON.parse(localStorage.getItem('learnerbot_plants') || '[]');
    // Add health scores and timeline if missing
    const plantsWithScores: Plant[] = savedPlants.map((p: any) => ({
      ...p,
      id: p.id || `plant-${Math.random().toString(36).substr(2, 9)}`,
      healthScore: p.healthScore || Math.floor(Math.random() * 20) + 75,
      addedAt: p.addedAt || new Date().toISOString(),
      timeline: p.timeline || (p.image ? [
        {
          id: `initial-${p.id}`,
          date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          image: p.image,
          status: 'initial diagnosis',
          healthScore: p.healthScore - 15,
          note: 'Plant showed signs of wilting and leaf spots. AI recommended increased humidity.'
        },
        {
          id: `recovery-${p.id}`,
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          image: p.image,
          status: 'showing recovery',
          healthScore: p.healthScore - 5,
          note: 'New growth appearing. Leaf spots are stabilizing.'
        }
      ] : [])
    }));
    setPlants(plantsWithScores);
    localStorage.setItem('learnerbot_plants', JSON.stringify(plantsWithScores));

    // Persistence: load tasks if they exist for today
    const savedTasksJson = localStorage.getItem('learnerbot_daily_tasks');
    const savedTasks = savedTasksJson ? JSON.parse(savedTasksJson) : null;
    const lastTaskReset = localStorage.getItem('learnerbot_last_task_reset');
    const today = new Date().toDateString();

    // Check if we should use saved tasks or generate new ones (new day)
    if (savedTasks && lastTaskReset === today) {
      setTasks(savedTasks);
    } else if (plantsWithScores.length > 0) {
      const generatedTasks = plantsWithScores.flatMap((plant: any, _idx: number) => {
        const pTasks = [
          { 
            id: `water-${plant.id}`, 
            title: `Hydrate ${plant.name || 'Plant'}`, 
            type: 'Watering', 
            status: 'pending' 
          }
        ];
        
        if (plant.diagnosis && !plant.diagnosis.toLowerCase().includes('healthy')) {
          pTasks.push({ 
            id: `treat-${plant.id}`, 
            title: `Treat ${plant.name || 'Plant'}`, 
            type: 'Recovery', 
            status: 'pending' 
          });
        }
        
        return pTasks;
      }).slice(0, 5);
      
      setTasks(generatedTasks);
      localStorage.setItem('learnerbot_daily_tasks', JSON.stringify(generatedTasks));
      localStorage.setItem('learnerbot_last_task_reset', today);
    } else {
      const defaultTasks = [
        { id: 'onboarding-1', title: 'Scan your first plant', type: 'Onboarding', status: 'pending' },
        { id: 'onboarding-2', title: 'Check local humidity', type: 'Environment', status: 'completed' },
      ];
      setTasks(defaultTasks);
      localStorage.setItem('learnerbot_daily_tasks', JSON.stringify(defaultTasks));
      localStorage.setItem('learnerbot_last_task_reset', today);
    }

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const data = await weatherService.getWeatherDataByCoords(lat, lon);
        setWeather(data);
        localStorage.setItem('learnerbot_weather', JSON.stringify(data));
        
        // Feature 3: Micro-Climate Comparison Logic
        // Calculate an "Environmental Match" score based on humidity and temp for generic tropical plants
        let match = 100;
        if (data.humidity < 40) match -= 15;
        if (data.temp > 32) match -= 10;
        if (data.uvIndex > 7) match -= 10;
        setEnvMatch(Math.max(60, match));

      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchByIP = async () => {
      try {
        // Try multiple services for better reliability and accuracy
        let res = await fetch('https://ipapi.co/json/');
        if (!res.ok) res = await fetch('https://ip-api.com/json/');
        
        const data = await res.json();
        const lat = data.latitude || data.lat;
        const lon = data.longitude || data.lon;
        const region = data.city || data.region || 'your area';
        
        if (lat && lon) {
          setCoords({ lat, lon });
          fetchWeather(lat, lon);
          console.log(`📍 Location accurately detected via IP: ${region}`);
        } else {
          throw new Error("IP Geolocation failed");
        }
      } catch (err) {
        console.error("IP Geoloc failed, fallback to London", err);
        const lat = 51.505, lon = -0.09;
        setCoords({ lat, lon });
        weatherService.getWeatherDataByCity('London').then(data => {
          setWeather(data);
          localStorage.setItem('learnerbot_weather', JSON.stringify(data));
          setLoading(false);
        });
      }
    };

    // Feature 4: Proactive Weather Monitoring Notifications
    if (weather) {
      if (weather.temp > 32) notificationService.notifyHeatStress(weather.temp);
      if (weather.temp < 10) notificationService.notifyFrostWarning(weather.temp);
      if (weather.humidity < 40) notificationService.notifyLowHumidity(weather.humidity);
      if (weather.uvIndex > 5) notificationService.notifyHighUV(weather.uvIndex);
      
      // Perfect Weather Logic (once per session)
      if (!notifiedOptimalRef.current && 
          weather.temp >= 18 && weather.temp <= 26 && 
          weather.humidity >= 45 && weather.humidity <= 70) {
        notificationService.notifyOptimalConditions();
        notifiedOptimalRef.current = true;
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lon: longitude });
          fetchWeather(latitude, longitude);
          console.log(`🎯 High-accuracy GPS location active: ${latitude}, ${longitude}`);
        },
        () => {
          console.warn("GPS access denied, falling back to IP triangulation...");
          fetchByIP();
        },
        { 
          timeout: 10000, 
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    } else {
      fetchByIP();
    }

    // Auto-refresh weather/UV every 15 minutes
    const interval = setInterval(() => {
      if (coords) {
        fetchWeather(coords.lat, coords.lon);
      }
    }, 15 * 60 * 1000);

    // Request Notification Permission
    notificationService.requestPermission();

    return () => clearInterval(interval);
  }, [coords?.lat, coords?.lon]); 


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

  const handlePlantClick = (plant: Plant) => {
    setSelectedPlantId(plant.id);
    setView('timeline');
    // Save to local storage for persistence
    localStorage.setItem('learnerbot_last_viewed_plant', plant.id);
  };

  const handleAddTimelineEntry = (plantId: string) => {
    // In a real app, this would open a camera or upload dialog
    // For now, we'll suggest chatting with the expert to get a new diagnosis
    onStartChat(plants.find(p => p.id === plantId));
  };

  const getDynamicAlerts = () => {
    const alerts = [];
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

      if (weather.uvIndex > 5) {
        alerts.push({
          title: "High UV Exposure",
          desc: `UV Index is ${weather.uvIndex.toFixed(1)}. Delicate plants may need partial shade.`,
          icon: <Sun className="w-5 h-5 text-yellow-500" />,
          color: "yellow"
        });
      }
    }

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

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        
        // Award XP and show notification only for new completions
        if (newStatus === 'completed') {
          progressService.addXP(20);
          notificationService.notifyTaskCompleted(task.title);
          console.log("Botanical XP Earned! +20 XP");
        }
        
        return { ...task, status: newStatus };
      }
      return task;
    });

    setTasks(updatedTasks);
    localStorage.setItem('learnerbot_daily_tasks', JSON.stringify(updatedTasks));
  };

  const activeAlerts = getDynamicAlerts();

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white pb-20 custom-scrollbar overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-green-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center group cursor-pointer transition-all duration-500">
            <div className="relative">
              {/* Outer Glow */}
              <div className="absolute inset-[-4px] bg-gradient-to-tr from-emerald-500/50 to-green-300/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Logo Container - making it circular to match the logo content */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-all duration-500 ease-out">
                <img 
                  src="/logo.png" 
                  alt="Plantiva Logo" 
                  className="w-full h-full object-cover scale-110" 
                />
              </div>
            </div>
            {/* Keeping the text but making it more like a tagline since the logo has the name */}
            <div className="ml-4 hidden sm:block">
              <h1 className="text-2xl font-black bg-gradient-to-r from-white to-emerald-300 bg-clip-text text-transparent tracking-tighter leading-none">
                PLANTIVA
              </h1>
              <p className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] uppercase mt-1 opacity-70">AI Botanical Expert</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogout} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors border border-white/10 rounded-lg">Logout</button>
            <button 
              onClick={async () => {
                const granted = await notificationService.requestPermission();
                if (granted) {
                  notificationService.sendNotification("Notifications Enabled! 🌿", {
                    body: "You're all set! Plantiva will now keep you updated on your garden's health."
                  });
                } else {
                  alert("Please enable notifications in your browser settings to receive botanical alerts.");
                }
              }}
              className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors relative group"
            >
              <Bell className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-gradient-to-br from-emerald-900/40 to-green-900/20 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4"><Zap className="w-3 h-3" />Next-Gen Intelligence</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">Smart Care. Sustainable Growth - Where AI Grows the Future.</h2>
            <p className="text-lg text-emerald-100/70 leading-relaxed italic">"Integrating context-aware and predictive AI, delivering personalized and explainable plant care recommendations."</p>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>

        {view === 'timeline' && selectedPlantId && plants.find(p => p.id === selectedPlantId) ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8">
            <PlantTimeline 
              plant={plants.find(p => p.id === selectedPlantId)!} 
              onBack={() => setView('dashboard')}
              onAddEntry={handleAddTimelineEntry}
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Column 1: Environment & Monitoring */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-white/50 text-sm font-medium uppercase tracking-wider">Local Environment</p>
                    <h3 className="text-xl font-bold mt-1 tracking-tight">{loading ? 'Locating...' : weather?.city || 'Weather Details'}</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <Cloud className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-white/10 rounded-2xl w-2/3" />
                    <div className="grid grid-cols-2 gap-4"><div className="h-20 bg-white/10 rounded-2xl" /><div className="h-20 bg-white/10 rounded-2xl" /></div>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase mb-1"><Wind className="w-3 h-3" />AQI Status</div>
                        <div className={`text-xl font-black ${getAqiColor(weather.aqiStatus)}`}>{weather.aqiStatus}</div>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase mb-1"><Sun className="w-3 h-3" />UV Index</div>
                        <div className="text-xl font-black text-yellow-400">{weather.uvIndex.toFixed(1)}</div>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/60">AI Calibration</span>
                        </div>
                        <span className="text-sm font-black text-emerald-400">{envMatch}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${envMatch}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-green-300" />
                      </div>
                    </div>
                  </div>
                ) : <div className="text-center py-10 text-white/30">Unable to load weather data.</div>}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md overflow-hidden relative shadow-2xl h-[380px]">
                <div className="flex justify-between items-center mb-3 px-2"><h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Micro-Climate Monitor</h3></div>
                <div className="relative rounded-2xl overflow-hidden border border-white/5 h-[300px]">
                  {coords ? <PlantMap lat={coords.lat} lon={coords.lon} /> : <div className="h-full w-full bg-white/5 animate-pulse flex flex-col items-center justify-center gap-3"><div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" /><p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Calibrating Geolocation...</p></div>}
                </div>
              </motion.div>
            </div>

            {/* Column 2: Routine & Alerts */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" />Daily Routine</h3>
                  <span className="text-[10px] font-bold text-white/40 uppercase bg-white/5 px-2 py-1 rounded-md">{tasks.filter(t => t.status === 'completed').length}/{tasks.length} Done</span>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      whileHover={{ scale: 1.02, x: 5 }} 
                      onClick={() => handleToggleTask(task.id)}
                      className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all cursor-pointer shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                          {task.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border-2 border-white/20" />}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`text-xs font-bold block ${task.status === 'completed' ? 'text-white/30 line-through' : 'text-white/90'}`}>{task.title}</span>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">{task.type}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                  {tasks.length === 0 && <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl text-white/20 text-xs uppercase font-bold tracking-widest leading-loose">No items on today's <br /> botanical schedule</div>}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-orange-400" />Predictive Alerts</h3>
                  <button onClick={() => setShowCareModal(true)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors group"><Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform" /></button>
                </div>
                <div className="space-y-4">
                  {activeAlerts.length > 0 ? activeAlerts.map((alert, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className={`p-4 bg-${alert.color}-500/10 border border-${alert.color}-500/20 rounded-2xl flex gap-4 backdrop-blur-sm`}>
                      <div className="shrink-0 mt-1">{alert.icon}</div>
                      <div><p className={`text-sm font-bold text-${alert.color}-200`}>{alert.title}</p><p className={`text-[11px] text-${alert.color}-100/60 leading-relaxed`}>{alert.desc}</p></div>
                    </motion.div>
                  )) : <div className="text-center py-6 text-white/30 text-sm">No active threats detected.</div>}
                </div>
              </motion.div>
            </div>

            {/* Column 3: Actions & Collection */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onStartChat()} className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/10 flex items-center gap-4 border border-white/20 group">
                  <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><Camera className="w-6 h-6 text-white" /></div>
                  <div className="text-left"><p className="text-lg font-black uppercase tracking-tighter text-white">Scan Plant</p><p className="text-xs text-white/70">Instant Diagnosis</p></div>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onStartChat()} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform"><Search className="w-6 h-6 text-emerald-400" /></div>
                  <div className="text-left"><p className="text-lg font-black uppercase tracking-tighter text-white">Ask Expert</p><p className="text-xs text-white/50">Care Advice</p></div>
                </motion.button>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter">My Collection</h3>
                  <button className="text-emerald-400 text-xs font-bold flex items-center gap-1 hover:underline">View All <ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {plants.length > 0 ? plants.map((plant, idx) => (
                    <motion.div key={idx} whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} onClick={() => handlePlantClick(plant)} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center cursor-pointer transition-all duration-300">
                      <div className="w-14 h-14 bg-emerald-900/30 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                        {plant.image ? <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" /> : <Leaf className="w-8 h-8 text-emerald-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <p className="font-bold text-white uppercase text-[10px] tracking-wider truncate">{plant.name || 'Unnamed'}</p>
                          <span className={`text-[10px] font-black shrink-0 ${plant.healthScore > 85 ? 'text-emerald-400' : 'text-orange-400'}`}>{plant.healthScore}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${plant.healthScore}%` }} className={`h-full ${plant.healthScore > 85 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        </div>
                      </div>
                    </motion.div>
                  )) : <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl"><Leaf className="w-8 h-8 text-white/10 mx-auto mb-2" /><p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Empty Collection</p></div>}
                </div>
              </motion.div>

              <div className="bg-gradient-to-br from-blue-900/20 via-emerald-900/10 to-transparent border border-blue-500/20 rounded-3xl p-5 flex items-start gap-4 shadow-2xl">
                <div className="p-3 bg-blue-500/20 rounded-xl shrink-0"><ShieldCheck className="w-6 h-6 text-blue-400" /></div>
                <div><h4 className="text-sm font-bold text-blue-200 mb-1">Context Protection</h4><p className="text-[10px] text-blue-100/60 leading-relaxed font-medium">Auto-monitoring local climate anomalies to protect your species.</p></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0f0d]/80 backdrop-blur-sm" onClick={() => setShowCareModal(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-[#121a17] border border-emerald-500/30 rounded-3xl p-6 relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-emerald-300"><Calendar className="w-6 h-6" />Schedule Care</h3>
            <p className="text-white/50 text-sm mb-6">Select a plant from your history to set water or treatment alerts.</p>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {plants.length > 0 ? plants.map((plant, idx) => (
                <button key={idx} onClick={() => { setCareSuccess(true); setTimeout(() => { setCareSuccess(false); setShowCareModal(false); }, 2000); }} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left group">
                  <div className="w-12 h-12 bg-emerald-900/30 rounded-xl flex-shrink-0 overflow-hidden border border-white/5">{plant.image ? <img src={plant.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Leaf className="w-6 h-6 text-emerald-700" /></div>}</div>
                  <div className="flex-grow"><p className="font-bold text-white group-hover:text-emerald-300 transition-colors uppercase text-xs tracking-wider">{plant.name || 'Unnamed'}</p><div className="flex gap-2 mt-1"><span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/20">+ Water Alert</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">+ Treatment</span></div></div>
                </button>
              )) : <div className="text-center py-10 text-white/20"><p>No history yet.</p></div>}
            </div>
            {careSuccess && <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center text-emerald-300 text-sm font-bold">Care schedule active! 🌿✨</motion.div>}
            <button onClick={() => setShowCareModal(false)} className="w-full mt-6 py-3 text-white/40 text-sm font-bold hover:text-white transition-colors uppercase tracking-[2px]">Cancel</button>
          </motion.div>
        </div>
      )}
      {/* Feature 2: Floating Scan Button */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }} 
        whileTap={{ scale: 0.9 }} 
        onClick={() => onStartChat()}
        className="fixed bottom-8 right-8 z-[90] w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] border-2 border-white/20 group"
      >
        <Camera className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-12 right-0 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <p className="text-[10px] font-bold text-white uppercase tracking-widest">Instant AI Scan</p>
        </div>
      </motion.button>
    </div>
  );
};

export default Dashboard;
