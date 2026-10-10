import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function LiveCameraWidget() {
  const navigate = useNavigate();
  return (
    <motion.div
      variants={itemVariants}
      onClick={() => navigate('/scan-plant')}
      className="glass-card h-full flex flex-col relative overflow-hidden group cursor-pointer"
    >
      <div className="absolute inset-0 bg-background/20" />

      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />

      <div className="p-4 flex justify-between items-center relative z-10 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
          <Camera className="w-4 h-4 text-accent" /> LIVE SCANNER
        </h3>
        <span className="text-[10px] text-accent flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" />
          Ready
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 p-8 min-h-[200px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border border-accent/30 bg-card/50 flex items-center justify-center mx-auto mb-3 group-hover:border-accent transition-colors">
            <ScanLine className="w-6 h-6 text-accent" />
          </div>
          <p className="text-xs text-gray-400">Tap to open your camera and scan a plant live</p>
        </div>
      </div>
    </motion.div>
  );
}
