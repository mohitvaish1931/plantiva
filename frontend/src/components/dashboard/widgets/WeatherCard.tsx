import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, MapPin, RefreshCw, Sun, CloudRain } from 'lucide-react';
import { cn } from '../../../utils';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function WeatherCard() {
  const { weather } = useData();

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">LOCAL ENVIRONMENT</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" /> {weather?.city || 'Fetching...'}
          </div>
          <button className="p-1 rounded-full hover:bg-card-hover transition-colors">
            <RefreshCw className="w-3 h-3 text-accent" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        {weather?.description.includes('rain') ? <CloudRain className="w-12 h-12 text-blue-400" /> :
         weather?.description.includes('cloud') ? <Cloud className="w-12 h-12 text-gray-400" /> :
         <Sun className="w-12 h-12 text-yellow-400" />}
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-light">{weather ? weather.temp : '--'}°</span>
          </div>
          <p className="text-sm font-medium capitalize">{weather?.description || 'Loading...'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Humidity: {weather?.humidity || '--'}% • Wind: {weather?.windSpeed || '--'} km/h</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-card/50 p-2 rounded-lg border border-border">
            <p className="text-gray-400 mb-1">AQI</p>
            <p className="font-semibold text-warning">{weather?.aqiStatus || 'Fair'} <span className="float-right">{weather?.aqi || '--'}</span></p>
          </div>
          <div className="bg-card/50 p-2 rounded-lg border border-border">
            <p className="text-gray-400 mb-1">UV</p>
            <p className="font-semibold text-warning">{weather?.sunImpact || 'Mod'} <span className="float-right">{weather?.uvIndex || '--'}</span></p>
          </div>
          <div className="bg-card/50 p-2 rounded-lg border border-border">
            <p className="text-gray-400 mb-1">Air</p>
            <p className="font-semibold text-accent">Good</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" /> AI Calibration
            </span>
            <span className="text-accent font-medium">Synced</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-accent shadow-glow-accent" 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
