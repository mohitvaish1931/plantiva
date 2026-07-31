import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Leaf, Bell } from 'lucide-react';
import { cn } from '../../../utils';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function PredictionCard() {
  const { alerts, plants } = useData();
  const displayAlerts = alerts.filter(a => a.type !== 'resolved').slice(0, 2);

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">PREDICTIVE ALERTS</h3>
        <button className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {displayAlerts.map(alert => (
          <motion.div 
            key={alert.id}
            whileHover={{ scale: 1.02 }}
            className={cn(
              "p-4 rounded-xl border cursor-pointer group flex items-start gap-3 transition-colors",
              alert.type === 'critical' ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20' : 'border-warning/30 bg-warning/10 hover:bg-warning/20'
            )}
          >
            <div className="mt-0.5">
              <AlertTriangle className={cn("w-5 h-5", alert.type === 'critical' ? 'text-red-400' : 'text-warning')} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className={cn("text-sm font-medium transition-colors", alert.type === 'critical' ? 'text-red-400' : 'text-warning')}>{alert.title}</h4>
                <ChevronRight className={cn("w-4 h-4 transition-colors", alert.type === 'critical' ? 'text-red-400/50 group-hover:text-red-400' : 'text-warning/50 group-hover:text-warning')} />
              </div>
              <p className={cn("text-xs leading-relaxed line-clamp-2", alert.type === 'critical' ? 'text-red-400/80' : 'text-warning/80')}>{alert.description}</p>
            </div>
          </motion.div>
        ))}

        {displayAlerts.length < 2 && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl border border-accent/30 bg-accent/10 cursor-pointer group flex items-start gap-3 transition-colors hover:bg-accent/20"
          >
            <div className="mt-0.5">
              <Leaf className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-accent group-hover:text-accent-secondary transition-colors">Active Collection</h4>
                <ChevronRight className="w-4 h-4 text-accent/50 group-hover:text-accent transition-colors" />
              </div>
              <p className="text-xs text-accent/80 leading-relaxed">{plants.length} plant models are being monitored and synced.</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
