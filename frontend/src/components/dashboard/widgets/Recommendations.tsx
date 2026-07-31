import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ArrowRight } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Recommendations() {
  return (
    <motion.div variants={itemVariants} className="glass-card p-6 h-full flex flex-col relative overflow-hidden group cursor-pointer border-accent/30 hover:border-accent/60 transition-colors">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <BrainCircuit className="w-32 h-32 text-accent transform rotate-12" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-accent/20 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-accent">AI INSIGHT</h3>
        </div>
        
        <h4 className="text-2xl font-light text-white mb-4 leading-tight">
          Based on humidity, UV index and leaf color, move the <span className="font-semibold text-accent">Peace Lily</span> into indirect sunlight.
        </h4>
        
        <div className="mt-auto">
          <button className="flex items-center gap-2 text-sm text-black bg-accent px-4 py-2 rounded-xl font-medium hover:bg-accent-secondary transition-colors shadow-glow-accent">
            Apply Recommendation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
