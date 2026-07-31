import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { cn } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function MapCard() {
  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
          MICRO-CLIMATE MONITOR <span className="text-accent flex items-center gap-1 text-xs"><span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" /> Live</span>
        </h3>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden relative border border-border group">
        {/* Generated Map Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
          style={{ backgroundImage: 'url("/assets/images/map_bg_1785433508669.jpg")' }}
        />
        <div className="absolute inset-0 bg-background/40" />

        {/* Floating User Location Marker */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <div className="w-4 h-4 bg-accent rounded-full shadow-glow-accent relative z-10" />
            <div className="absolute inset-0 bg-accent/40 rounded-full animate-[ping_2s_ease-in-out_infinite]" />
            
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md border border-border px-3 py-2 rounded-lg w-48 text-center shadow-lg">
              <p className="text-accent font-medium text-xs mb-0.5">You are here</p>
              <p className="text-[10px] text-gray-300">Monitoring plant health in your micro-climate.</p>
            </div>
          </div>
        </motion.div>

        {/* Floating Stats panel */}
        <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between w-32 gap-2">
          <StatBox icon={Thermometer} label="Temperature" value="30°C" />
          <StatBox icon={Droplets} label="Humidity" value="60%" />
          <StatBox icon={Wind} label="Wind Speed" value="14 km/h" />
          <StatBox icon={CloudRain} label="Precipitation" value="0%" />
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
