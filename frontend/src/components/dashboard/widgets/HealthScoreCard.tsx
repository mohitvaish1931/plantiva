import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { averageHealth } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function HealthScoreCard() {
  const { plants, weather } = useData();
  const score = averageHealth(plants);
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - ((score ?? 0) / 100) * circumference;

  const weakest = plants.length ? plants.reduce((a, b) => (b.healthScore < a.healthScore ? b : a)) : null;

  let title = 'No scans yet';
  let message = 'Scan a plant to get its health score. The score is the average of all your scans.';
  let ringColor = 'text-accent';
  if (score !== null) {
    if (score >= 80) {
      title = 'Looking good!';
      message = `Your plants average ${score}/100.`;
    } else if (score >= 55) {
      title = 'Needs some care';
      message = `Average health is ${score}/100.`;
      ringColor = 'text-warning';
    } else {
      title = 'Plants need attention';
      message = `Average health is only ${score}/100.`;
      ringColor = 'text-red-400';
    }
    if (weakest && weakest.healthScore < 80) {
      message += ` Check ${weakest.name} first (${weakest.healthScore}/100${weakest.disease && weakest.disease !== 'None' ? `, ${weakest.disease}` : ''}).`;
    }
    if (weather && weather.humidity < 40) message += ` Humidity is low (${weather.humidity}%).`;
  }

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gray-300">PLANT HEALTH SCORE</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {plants.length ? `Average of ${plants.length} ${plants.length === 1 ? 'scan' : 'scans'}` : 'Overall collection vitality'}
          </p>
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
            className={`${ringColor} drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score ?? '--'}</span>
          <span className="text-[10px] text-gray-400">/ 100</span>
        </div>
      </div>

      <div className="bg-card-hover rounded-xl p-3 flex items-start gap-3 border border-border">
        <div className="p-2 rounded-lg bg-accent/10">
          <Activity className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-xs font-medium text-white mb-0.5">{title}</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}
