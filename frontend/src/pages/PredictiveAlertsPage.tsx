import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, AlertTriangle, ShieldCheck, ChevronDown, Activity, Wind, Droplets } from 'lucide-react';
import { cn } from '../utils';
import { useData } from '../context/DataContext';

export function PredictiveAlertsPage() {
  const { alerts } = useData();
  const [activeTab, setActiveTab] = useState<'active' | 'historical'>('active');
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  const displayedAlerts = alerts.filter(a => 
    activeTab === 'active' ? a.type !== 'resolved' : a.type === 'resolved'
  );

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Predictive Alerts</h1>
          <p className="text-gray-400">AI-driven warnings to protect your plants before issues occur.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('active')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'active' ? "bg-red-500/10 text-red-400" : "text-gray-400 hover:text-white")}
          >
            Active Threats
          </button>
          <button 
            onClick={() => setActiveTab('historical')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === 'historical' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
          >
            Historical
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {displayedAlerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20 border border-dashed border-border rounded-3xl"
            >
              <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">All systems green. No {activeTab} alerts.</p>
            </motion.div>
          ) : (
            displayedAlerts.map((alert) => {
              const isExpanded = expandedAlert === alert.id;
              
              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "glass-card border rounded-2xl overflow-hidden transition-all duration-300",
                    alert.type === 'critical' ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
                    alert.type === 'warning' ? 'border-yellow-500/30' : 'border-border'
                  )}
                >
                  <div 
                    className="p-5 flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                      alert.type === 'critical' ? 'bg-red-500/10 border-red-500/20' : 
                      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : 
                      'bg-accent/10 border-accent/20'
                    )}>
                      {alert.type === 'resolved' ? (
                        <ShieldCheck className="w-6 h-6 text-accent" />
                      ) : (
                        <AlertTriangle className={cn("w-6 h-6", alert.type === 'critical' ? 'text-red-400' : 'text-yellow-400')} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 mt-1">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <h3 className="text-lg font-medium text-white">{alert.title}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{alert.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{alert.description}</p>
                    </div>

                    <div className="mt-2 text-gray-500 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 border-t border-border/50">
                          <p className="text-sm text-gray-300 leading-relaxed mb-6 mt-4">
                            {alert.details}
                          </p>
                          
                          {alert.metrics.length > 0 && (
                            <div className="flex gap-4">
                              {alert.metrics.map((metric, i) => (
                                <div key={i} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50 flex-1">
                                  <div className="bg-white/5 p-2 rounded-lg">
                                    <metric.icon className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{metric.label}</p>
                                    <p className="text-sm font-medium text-white">{metric.value}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {alert.type !== 'resolved' && (
                            <div className="mt-6 flex justify-end">
                              <button className="px-4 py-2 rounded-xl bg-accent text-black font-semibold text-sm hover:bg-accent-secondary transition-colors">
                                I've Taken Action
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
