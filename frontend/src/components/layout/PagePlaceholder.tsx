import React from 'react';
import { motion } from 'framer-motion';

export function PagePlaceholder({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto h-[80vh] flex flex-col items-center justify-center text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 shadow-glow-accent">
        <Icon className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-3xl font-light text-white mb-3">{title}</h2>
      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">{description}</p>
    </motion.div>
  );
}
