import React from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function ExpertCard() {
  return (
    <motion.div 
      variants={itemVariants} 
      className="glass-card h-full flex flex-col relative overflow-hidden group cursor-pointer"
    >
      {/* Background Image (Expert Avatar) */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: 'url("/assets/images/expert_avatar_1785433498995.jpg")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="p-5 flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-blue" /> ASK EXPERT
          </h3>
          <p className="text-xs text-gray-400 mt-1">Get care advice</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end p-5 relative z-10">
        <div className="flex justify-end">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center shadow-glow-accent"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
