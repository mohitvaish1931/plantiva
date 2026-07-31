import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function ScanCard() {
  const navigate = useNavigate();
  return (
    <motion.div 
      variants={itemVariants} 
      onClick={() => navigate('/scan-plant')}
      className="glass-card p-5 h-full flex flex-col relative overflow-hidden group cursor-pointer"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-accent" /> SCAN PLANT
          </h3>
          <p className="text-xs text-gray-400 mt-1">Instant AI Diagnosis</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="relative">
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border border-accent/30 animate-[ping_3s_ease-in-out_infinite]" />
          <div className="absolute -inset-4 rounded-full border border-accent/10 animate-[spin_4s_linear_infinite]" />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent flex items-center justify-center shadow-glow-accent relative z-10"
          >
            <Camera className="w-10 h-10 text-accent" />
          </motion.div>
        </div>
        <p className="text-xs text-gray-400 mt-8">Tap to scan or upload a photo</p>
      </div>
    </motion.div>
  );
}
