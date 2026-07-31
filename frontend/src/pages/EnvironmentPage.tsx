import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, ThermometerSun, Droplets, Wind, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '../utils';
import { useData } from '../context/DataContext';

export function EnvironmentPage() {
  const { weather } = useData();
  const [activeMetric, setActiveMetric] = useState<'temp' | 'humidity' | 'light'>('temp');

  const envData = useMemo(() => {
    if (!weather) return [];
    const baseTemp = weather.temp;
    const baseHum = weather.humidity;
    
    return [
      { time: '00:00', temp: baseTemp - 3, humidity: baseHum + 5, light: 0 },
      { time: '04:00', temp: baseTemp - 4, humidity: baseHum + 8, light: 0 },
      { time: '08:00', temp: baseTemp - 1, humidity: baseHum + 2, light: 40 },
      { time: '12:00', temp: baseTemp + 2, humidity: baseHum - 5, light: 85 },
      { time: '16:00', temp: baseTemp + 3, humidity: baseHum - 8, light: 60 },
      { time: '20:00', temp: baseTemp, humidity: baseHum, light: 10 },
      { time: '24:00', temp: baseTemp - 2, humidity: baseHum + 4, light: 0 },
    ];
  }, [weather]);

  const getMetricDetails = () => {
    switch(activeMetric) {
      case 'temp': return { color: '#ef4444', label: 'Temperature (°C)', current: '26°C', status: 'Optimal' };
      case 'humidity': return { color: '#3b82f6', label: 'Humidity (%)', current: '38%', status: 'Low' };
      case 'light': return { color: '#f59e0b', label: 'Light Exposure', current: 'High', status: 'Optimal' };
    }
  };

  const details = getMetricDetails();

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Micro-Climate</h1>
          <p className="text-gray-400">Real-time environmental monitoring for your indoor garden.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1">
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white transition-colors">Today</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Week</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Month</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setActiveMetric('temp')}
            className={cn("glass-card border rounded-3xl p-6 cursor-pointer transition-all", activeMetric === 'temp' ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-border hover:border-white/20")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ThermometerSun className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/20 text-accent">Optimal</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Avg Temperature</p>
            <h3 className="text-3xl font-light text-white">26°C</h3>
          </div>

          <div 
            onClick={() => setActiveMetric('humidity')}
            className={cn("glass-card border rounded-3xl p-6 cursor-pointer transition-all", activeMetric === 'humidity' ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-border hover:border-white/20")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-500">Warning</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Indoor Humidity</p>
            <h3 className="text-3xl font-light text-white">38%</h3>
          </div>

          <div 
            onClick={() => setActiveMetric('light')}
            className={cn("glass-card border rounded-3xl p-6 cursor-pointer transition-all", activeMetric === 'light' ? "border-yellow-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-border hover:border-white/20")}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <CloudSun className="w-6 h-6 text-yellow-500" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/20 text-accent">Optimal</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Light Exposure</p>
            <h3 className="text-3xl font-light text-white">High</h3>
          </div>
        </div>

        {/* Big Chart */}
        <div className="lg:col-span-2 glass-card border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-medium text-white">{details.label} Trends</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: details.color }} />
              <span className="text-gray-400">Current: <span className="text-white font-medium">{details.current}</span></span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={envData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={details.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={details.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(16,20,18,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey={activeMetric} stroke={details.color} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Map & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card border border-border rounded-3xl overflow-hidden h-64 relative group">
            <img src="/assets/images/map_bg_1785433508669.jpg" alt="Map" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            
            {/* Pulsing Dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-accent border-2 border-background"></span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-card/80 backdrop-blur-md border border-border rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Location</p>
                <p className="text-sm font-medium text-white">Indoor Garden</p>
              </div>
              <Wind className="w-5 h-5 text-accent" />
            </div>
          </div>

          <div className="glass-card border border-border rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sensors Online</span>
                <span className="text-sm font-medium text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> 4/4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Last Sync</span>
                <span className="text-sm font-medium text-white">2 mins ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network Stability</span>
                <span className="text-sm font-medium text-accent">99.9%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
