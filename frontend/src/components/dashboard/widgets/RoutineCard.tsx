import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { cn } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface Task {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
}

export function RoutineCard() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Scan your first plant', subtitle: 'ONBOARDING', completed: false },
    { id: '2', title: 'Check local humidity', subtitle: 'ENVIRONMENT', completed: true },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">DAILY ROUTINE</h3>
        <span className="text-xs bg-card border border-border px-2 py-1 rounded-md text-gray-400">
          {completedCount}/{tasks.length} DONE
        </span>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {tasks.map((task) => (
          <motion.div 
            key={task.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleTask(task.id)}
            className={cn(
              "p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-colors",
              task.completed 
                ? "bg-accent/10 border-accent/30" 
                : "bg-card/50 border-border hover:bg-card-hover"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
              task.completed ? "bg-accent border-accent text-black" : "border-gray-500 text-transparent"
            )}>
              <Check className="w-3 h-3" />
            </div>
            <div>
              <p className={cn("text-sm font-medium", task.completed ? "text-gray-300" : "text-white")}>
                {task.title}
              </p>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
                {task.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
