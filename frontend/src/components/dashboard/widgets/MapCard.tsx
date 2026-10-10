import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Wind, CloudRain, MapPin } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { LocationMap } from '../../LocationMap';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function MapCard() {
  const { weather, locationSource, weatherLoading } = useData();
  const place = weather ? [weather.area, weather.city].filter(Boolean).join(', ') : '';

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 relative z-10 gap-2">
        <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
          MICRO-CLIMATE MONITOR <span className="text-accent flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" /> Live</span>
        </h3>
      </div>

      <div className="flex-1 min-h-[280px] rounded-xl overflow-hidden relative border border-border">
        {weather ? (
          <LocationMap
            lat={weather.lat}
            lon={weather.lon}
            label={place || 'You are here'}
            approximate={locationSource === 'ip'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            {weatherLoading ? 'Finding your location...' : 'Location unavailable'}
          </div>
        )}

        {place && (
          <div className="absolute left-3 bottom-3 z-[500] bg-card/90 backdrop-blur-md border border-border px-3 py-2 rounded-lg max-w-[55%] pointer-events-none">
            <p className="text-accent font-medium text-xs mb-0.5 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {place}</p>
            <p className="text-[10px] text-gray-300">{locationSource === 'ip' ? 'Approximate location' : 'Your location'}</p>
          </div>
        )}

        {/* Floating Stats panel */}
        <div className="absolute right-3 top-3 bottom-3 z-[500] flex flex-col justify-between w-32 gap-2 pointer-events-none">
          <StatBox icon={Thermometer} label="Temperature" value={weather ? `${weather.temp}°C` : '--'} />
          <StatBox icon={Droplets} label="Humidity" value={weather ? `${weather.humidity}%` : '--'} />
          <StatBox icon={Wind} label="Wind Speed" value={weather ? `${weather.windSpeed} km/h` : '--'} />
          <StatBox icon={CloudRain} label="Rain chance" value={weather ? `${weather.precipitation}%` : '--'} />
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-card/80 backdrop-blur-md border border-border rounded-lg p-2.5 flex items-center gap-2">
      <Icon className="w-4 h-4 text-accent shrink-0" />
      <div>
        <p className="text-[9px] text-gray-400">{label}</p>
        <p className="text-xs font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
