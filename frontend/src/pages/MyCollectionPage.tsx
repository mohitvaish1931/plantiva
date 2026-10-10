import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Leaf, HeartPulse, Sparkles, X, Activity, Target, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn, formatScanDate, plantStatus } from '../utils';
import { useData } from '../context/DataContext';
import { Plant } from '../types';

export function MyCollectionPage() {
  const { plants, updatePlant, deletePlant, tasks, toggleTaskComplete } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { plantId?: string } | null)?.plantId ?? null
  );
  const selectedPlant: Plant | null = plants.find(p => p.id === selectedId) ?? null;
  const setSelectedPlant = (plant: Plant | null) => setSelectedId(plant?.id ?? null);

  // Opened from a "Recent Scans" row: don't reopen the same plant after a refresh.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = ['All', 'Healthy', 'Needs Attention', 'Critical'];

  const filteredPlants = plants.filter(plant => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = [plant.name, plant.species, plant.disease].some(v => (v || '').toLowerCase().includes(q));
    if (activeCategory === 'All') return matchesSearch;
    return matchesSearch && plantStatus(plant) === activeCategory;
  });

  const handleWater = (plant: Plant) => {
    updatePlant(plant.id, { lastWatered: new Date().toISOString() });
    const waterTask = tasks.find(t => t.plantId === plant.id && t.type === 'water' && !t.isCompleted);
    if (waterTask) toggleTaskComplete(waterTask.id);
    toast.success(`Watering logged for ${plant.name} 💧`);
  };

  const handleDelete = (plant: Plant) => {
    if (!window.confirm(`Remove ${plant.name} from your collection?`)) return;
    deletePlant(plant.id);
    setSelectedPlant(null);
    toast.success(`${plant.name} removed`);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20 relative">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">My Collection</h1>
          <p className="text-gray-400">Every plant you scan is saved here with its health history.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search plants or diseases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/scan-plant')}
            className="px-4 py-2 bg-accent text-black text-sm font-semibold rounded-xl hover:bg-accent-secondary transition-colors whitespace-nowrap"
          >
            + Scan
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === category
                ? "bg-white/10 text-white shadow-lg border border-white/10"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Plant Grid */}
      {plants.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-3xl">
          <Leaf className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg mb-2">Your collection is empty</p>
          <p className="text-sm text-gray-500 mb-6">Scan a plant to add it to your collection</p>
          <button
            onClick={() => navigate('/scan-plant')}
            className="px-6 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent"
          >
            Scan New Plant
          </button>
        </div>
      ) : filteredPlants.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No plants match this filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPlants.map((plant) => {
              const status = plantStatus(plant);
              return (
                <motion.div
                  key={plant.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedPlant(plant)}
                  className="glass-card border border-border rounded-3xl overflow-hidden cursor-pointer group"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={plant.image || 'https://images.unsplash.com/photo-1545241047-6083a36a1d18?w=500&q=80'}
                      alt={plant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                      <HeartPulse className={cn("w-3.5 h-3.5", status === 'Healthy' ? "text-accent" : status === 'Critical' ? "text-red-400" : "text-yellow-500")} />
                      <span className="text-xs font-semibold text-white">{plant.healthScore}/100</span>
                    </div>
                  </div>

                  <div className="p-5 relative">
                    <div className="absolute -top-6 right-5 w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center shadow-lg">
                      <Leaf className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1 truncate">{plant.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 italic truncate">{plant.species || 'Species not identified'}</p>

                    <div className="flex items-center justify-between gap-2 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{plant.disease && plant.disease !== 'None' ? plant.disease : status}</span>
                      </div>
                      <span className="shrink-0">{formatScanDate(plant.addedAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Plant Details Modal (portaled so the sidebar can't cover it) */}
      {createPortal(<AnimatePresence>
        {selectedPlant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPlant(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedPlant(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/10 z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="h-56 relative shrink-0">
                <img src={selectedPlant.image || 'https://images.unsplash.com/photo-1545241047-6083a36a1d18?w=500&q=80'} alt={selectedPlant.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-light text-white mb-1 truncate">{selectedPlant.name}</h2>
                  <p className="text-accent font-medium italic">{selectedPlant.species || 'Species not identified'}</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <HeartPulse className="w-5 h-5 text-accent mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Health Score</p>
                    <p className="text-lg font-semibold text-white">{selectedPlant.healthScore}/100</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Activity className="w-5 h-5 text-blue-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <p className="text-lg font-semibold text-white">{plantStatus(selectedPlant)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Target className="w-5 h-5 text-cyan-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">AI Confidence</p>
                    <p className="text-lg font-semibold text-white">{typeof selectedPlant.confidence === 'number' ? `${selectedPlant.confidence}%` : '—'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Sparkles className="w-5 h-5 text-yellow-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Main Issue</p>
                    <p className="text-sm font-semibold text-white">{selectedPlant.disease || '—'}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Scanned {formatScanDate(selectedPlant.addedAt)}</span>
                  {selectedPlant.lastWatered && <span>Last watered {formatScanDate(selectedPlant.lastWatered)}</span>}
                </div>

                {selectedPlant.diagnosis && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed space-y-2">
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 marker:text-accent" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 marker:text-accent" {...props} />,
                      }}
                    >
                      {selectedPlant.diagnosis}
                    </ReactMarkdown>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleWater(selectedPlant)}
                    className="flex-1 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent"
                  >
                    Water Now
                  </button>
                  <button
                    onClick={() => navigate('/ai-expert', {
                      state: { question: `My ${selectedPlant.name} has a health score of ${selectedPlant.healthScore}/100${selectedPlant.disease && selectedPlant.disease !== 'None' ? ` and ${selectedPlant.disease}` : ''}. What should I do next?` }
                    })}
                    className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Ask AI Expert
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPlant)}
                    title="Remove from collection"
                    className="py-3 px-4 bg-red-500/10 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Remove</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

    </div>
  );
}
