import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Leaf, 
  Activity, 
  MessageSquare, 
  Clock, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { Plant } from '../types';

interface PlantTimelineProps {
  plant: Plant;
  onBack: () => void;
  onAddEntry: (plantId: string) => void;
}

const PlantTimeline: React.FC<PlantTimelineProps> = ({ plant, onBack, onAddEntry }) => {
  // Sort timeline by date descending
  const sortedTimeline = [...(plant.timeline || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between mb-8 px-2">
        <div>
          <button 
            onClick={onBack}
            className="text-emerald-400 text-sm font-bold flex items-center gap-1 hover:underline mb-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {plant.image ? (
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <Leaf className="w-8 h-8 text-emerald-700" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">{plant.name}</h2>
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase">{plant.species || 'Unknown Species'}</p>
            </div>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddEntry(plant.id)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-colors border border-emerald-400/30"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wider text-xs hidden sm:block">Add Snapshot</span>
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar lg:max-h-[60vh]">
        {sortedTimeline.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
            <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 font-bold uppercase tracking-[0.2em] text-sm">No snapshots recorded yet</p>
            <p className="text-white/20 text-xs mt-2">Start your healing journey by adding a daily update.</p>
          </div>
        ) : (
          <div className="relative pl-8 sm:pl-10 space-y-12 pb-10">
            {/* Timeline Line */}
            <div className="absolute left-4 sm:left-5 top-4 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />
            
            {sortedTimeline.map((entry, idx) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-8 sm:-left-9 top-1.5 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-[#0a0f0d] bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Image Section */}
                    {entry.image && (
                      <div className="shrink-0">
                        <div className="w-full lg:w-48 h-48 lg:h-32 rounded-2xl overflow-hidden border border-white/10 shadow-xl group-hover:scale-105 transition-transform duration-500">
                          <img src={entry.image} alt="Update" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    
                    {/* Content Section */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <h4 className="text-xl font-bold text-white mt-1 capitalize">{entry.status}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-lg font-black text-emerald-400">{entry.healthScore}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {entry.note && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                            <p className="text-sm text-emerald-100/70 leading-relaxed italic">"{entry.note}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/20 border border-emerald-500/20 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Recovery Trend</h4>
          </div>
          <div className="flex items-end gap-1 h-20 mb-2">
            {[45, 52, 58, 65, 72, 85].map((val, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                className="flex-1 bg-emerald-500/30 rounded-t-lg border-t border-emerald-400/50"
              />
            ))}
          </div>
          <p className="text-[10px] text-emerald-400/60 font-medium uppercase tracking-widest text-center mt-4">Last 7 Days Vitality Boost</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:bg-white/10 transition-all cursor-pointer">
          <div className="relative z-10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">Botanical Advice</h4>
            <p className="text-[11px] text-white/50 leading-relaxed mb-4">Based on the latest snapshots, your {plant.name} is showing excellent progress. Keep maintaining current hydration cycles.</p>
            <div className="flex items-center text-[10px] font-black uppercase text-emerald-300 gap-1 group-hover:translate-x-2 transition-transform">
              Full Diagnostics Report <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default PlantTimeline;
