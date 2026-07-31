import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle2, Circle, Droplets, Sparkles, Scissors, ThermometerSun } from 'lucide-react';
import { cn } from '../utils';
import { useData, CareTask } from '../context/DataContext';

export function PlantCarePage() {
  const { tasks, toggleTaskComplete } = useData();
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

  const toggleTask = (id: number) => {
    toggleTaskComplete(id);
  };

  const filteredTasks = tasks.filter(t => filter === 'completed' ? t.isCompleted : !t.isCompleted);

  const getTaskIcon = (type: CareTask['type']) => {
    switch (type) {
      case 'water': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'fertilize': return <Sparkles className="w-5 h-5 text-yellow-500" />;
      case 'prune': return <Scissors className="w-5 h-5 text-green-400" />;
      case 'sunlight': return <ThermometerSun className="w-5 h-5 text-orange-400" />;
    }
  };

  const getTaskColor = (type: CareTask['type']) => {
    switch (type) {
      case 'water': return 'bg-blue-500/10 border-blue-500/20';
      case 'fertilize': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'prune': return 'bg-green-500/10 border-green-500/20';
      case 'sunlight': return 'bg-orange-500/10 border-orange-500/20';
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Plant Care Schedule</h1>
          <p className="text-gray-400">Keep track of your daily plant care routines.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1">
          <button 
            onClick={() => setFilter('pending')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", filter === 'pending' ? "bg-accent/20 text-accent" : "text-gray-400 hover:text-white")}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", filter === 'completed' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20 border border-dashed border-border rounded-3xl"
              >
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">All caught up! No {filter} tasks.</p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "glass-card border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300",
                    task.isCompleted ? "border-border/50 opacity-60" : "border-border hover:border-accent/50"
                  )}
                >
                  <div className="shrink-0">
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-accent" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shrink-0", getTaskColor(task.type))}>
                    {getTaskIcon(task.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-lg font-medium mb-1 transition-colors", task.isCompleted ? "text-gray-400 line-through" : "text-white")}>
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1)} {task.plantName}
                    </h3>
                    <p className="text-sm text-gray-500">Due: {task.dueDate}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Mini Calendar Widget */}
        <div className="lg:col-span-1">
          <div className="glass-card border border-border rounded-3xl p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-white">This Week</h3>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-500">{day}</div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => {
                const isToday = i === 3;
                const hasTask = i === 3 || i === 4;
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "aspect-square rounded-full flex flex-col items-center justify-center text-sm relative",
                      isToday ? "bg-accent text-black font-bold shadow-glow-accent" : "text-gray-300 hover:bg-card-hover cursor-pointer"
                    )}
                  >
                    {12 + i}
                    {hasTask && !isToday && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <h4 className="text-sm font-medium text-white mb-2">Weekly Summary</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Watering</span>
                  <span className="text-white">12 tasks</span>
                </div>
                <div className="flex justify-between">
                  <span>Fertilizing</span>
                  <span className="text-white">3 tasks</span>
                </div>
                <div className="flex justify-between">
                  <span>Pruning</span>
                  <span className="text-white">1 task</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
