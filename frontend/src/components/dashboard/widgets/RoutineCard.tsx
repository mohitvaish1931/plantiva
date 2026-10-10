import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Droplets, Sparkles, Scissors, ThermometerSun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils';
import { useData, CareTask } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const TASK_LABEL: Record<CareTask['type'], string> = {
  water: 'Water',
  fertilize: 'Fertilize',
  prune: 'Prune',
  sunlight: 'Check sunlight for',
};

const TASK_ICON: Record<CareTask['type'], React.ElementType> = {
  water: Droplets,
  fertilize: Sparkles,
  prune: Scissors,
  sunlight: ThermometerSun,
};

export function RoutineCard() {
  const { plants, tasks, toggleTaskComplete } = useData();
  const navigate = useNavigate();

  const todayTasks = tasks.filter(t => t.dueDate === 'Today');
  const shown = todayTasks.slice(0, 3);
  const completedCount = todayTasks.filter(t => t.isCompleted).length;

  const onboarding = [
    { id: 'scan', title: 'Scan your first plant', subtitle: 'ONBOARDING', path: '/scan-plant' },
    { id: 'env', title: 'Check your local weather', subtitle: 'ENVIRONMENT', path: '/environment' },
    { id: 'expert', title: 'Ask the AI expert', subtitle: 'AI EXPERT', path: '/ai-expert' },
  ];

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">DAILY ROUTINE</h3>
        {plants.length > 0 ? (
          <span className="text-xs bg-card border border-border px-2 py-1 rounded-md text-gray-400">
            {completedCount}/{todayTasks.length} DONE
          </span>
        ) : (
          <span className="text-xs bg-card border border-border px-2 py-1 rounded-md text-gray-400">GET STARTED</span>
        )}
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {plants.length === 0 && onboarding.map(item => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.path)}
            className="p-4 rounded-xl border flex items-center gap-4 text-left bg-card/50 border-border hover:bg-card-hover transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">{item.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </motion.button>
        ))}

        {plants.length > 0 && todayTasks.length === 0 && (
          <p className="text-sm text-gray-400 text-center">Nothing due today. Your plants are on track! 🌿</p>
        )}

        {shown.map((task) => {
          const Icon = TASK_ICON[task.type];
          return (
            <motion.button
              key={task.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleTaskComplete(task.id)}
              className={cn(
                "p-4 rounded-xl border flex items-center gap-4 text-left transition-colors",
                task.isCompleted
                  ? "bg-accent/10 border-accent/30"
                  : "bg-card/50 border-border hover:bg-card-hover"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0",
                task.isCompleted ? "bg-accent border-accent text-black" : "border-gray-500 text-transparent"
              )}>
                <Check className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", task.isCompleted ? "text-gray-400 line-through" : "text-white")}>
                  {TASK_LABEL[task.type]} {task.plantName}
                </p>
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5 flex items-center gap-1">
                  <Icon className="w-3 h-3" /> {task.type}
                </p>
              </div>
            </motion.button>
          );
        })}

        {plants.length > 0 && (
          <button
            onClick={() => navigate('/plant-care')}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 self-end"
          >
            {todayTasks.length > shown.length ? `+${todayTasks.length - shown.length} more · ` : ''}Full schedule <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
