import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sparkles, Scissors, ThermometerSun } from 'lucide-react';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function CareCalendar() {
  const { tasks } = useData();
  const displayTasks = tasks.filter(t => !t.isCompleted).slice(0, 4);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'fertilize': return <Sparkles className="w-4 h-4 text-yellow-500" />;
      case 'prune': return <Scissors className="w-4 h-4 text-green-400" />;
      case 'sunlight': return <ThermometerSun className="w-4 h-4 text-orange-400" />;
      default: return <Droplets className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'water': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'fertilize': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'prune': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'sunlight': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold tracking-wide text-gray-300 mb-6">CARE CALENDAR</h3>
      
      <div className="relative flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-border rounded-full" />
        
        <div className="space-y-6">
          {displayTasks.map((task, i) => (
            <div key={i} className="relative flex items-start gap-4">
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border ${getTaskColor(task.type)}`}>
                {getTaskIcon(task.type)}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-xs text-gray-400 font-mono mb-1">{task.dueDate}</p>
                <div className="bg-card-hover p-3 rounded-lg border border-border">
                  <p className="text-sm text-white font-medium capitalize">{task.type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.plantName}</p>
                </div>
              </div>
            </div>
          ))}
          {displayTasks.length === 0 && (
            <div className="relative flex items-start gap-4 ml-12">
              <p className="text-gray-500 text-sm mt-4">All caught up!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
