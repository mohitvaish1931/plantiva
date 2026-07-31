import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function HealthScoreCard() {
  const score = 85;
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gray-300">PLANT HEALTH SCORE</h3>
          <p className="text-xs text-gray-400 mt-0.5">Overall collection vitality</p>
        </div>
        <ShieldCheck className="w-5 h-5 text-accent" />
      </div>

      <div className="flex-1 flex items-center justify-center relative my-4">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-card-hover"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            cx="64"
            cy="64"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            className="text-accent drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-[10px] text-gray-400">/ 100</span>
        </div>
      </div>

      <div className="bg-card-hover rounded-xl p-3 flex items-start gap-3 border border-border">
        <div className="p-2 rounded-lg bg-accent/10">
          <Activity className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-xs font-medium text-white mb-0.5">Looking good!</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">Your plants are thriving. Humidity is optimal, but monitor the Peace Lily for UV exposure.</p>
        </div>
      </div>
    </motion.div>
  );
}
