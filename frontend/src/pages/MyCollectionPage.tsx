import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Leaf, HeartPulse, Sparkles, X, Activity } from 'lucide-react';
import { cn } from '../utils';
import { useData } from '../context/DataContext';
import { Plant } from '../types';

export function MyCollectionPage() {
  const { plants } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const categories = ['All', 'Healthy', 'Needs Attention', 'Indoor', 'Outdoor'];

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategory === 'Healthy') return matchesSearch && plant.healthScore >= 80;
    if (activeCategory === 'Needs Attention') return matchesSearch && plant.healthScore < 80;
    return matchesSearch;
  });

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20 relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">My Collection</h1>
          <p className="text-gray-400">Manage and monitor all your green companions.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search plants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            />
          </div>
          <button className="p-2.5 bg-card border border-border rounded-xl hover:bg-card-hover transition-colors">
            <Filter className="w-4 h-4 text-gray-400" />
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
          <button className="px-6 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent">
            Scan New Plant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPlants.map((plant) => (
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
                    <HeartPulse className={cn("w-3.5 h-3.5", plant.healthScore > 80 ? "text-accent" : "text-yellow-500")} />
                    <span className="text-xs font-semibold text-white">{plant.healthScore}%</span>
                  </div>
                </div>
                
                <div className="p-5 relative">
                  <div className="absolute -top-6 right-5 w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center shadow-lg">
                    <Leaf className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">{plant.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{plant.species || 'Unknown Species'}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>{plant.timeline?.[0]?.status || 'Unknown Status'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Plant Details Modal */}
      <AnimatePresence>
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
              className="w-full max-w-2xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedPlant(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/10 z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="h-64 relative">
                <img src={selectedPlant.image || 'https://images.unsplash.com/photo-1545241047-6083a36a1d18?w=500&q=80'} alt={selectedPlant.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <h2 className="text-3xl font-light text-white mb-1">{selectedPlant.name}</h2>
                  <p className="text-accent font-medium">{selectedPlant.species || 'Unknown Species'}</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <HeartPulse className="w-5 h-5 text-accent mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Health Score</p>
                    <p className="text-lg font-semibold text-white">{selectedPlant.healthScore}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Activity className="w-5 h-5 text-blue-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <p className="text-lg font-semibold text-white">{selectedPlant.timeline?.[0]?.status || 'Healthy'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 md:col-span-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 mb-2" />
                    <p className="text-xs text-gray-400 mb-1">Diagnosis</p>
                    <p className="text-sm font-medium text-white line-clamp-2">{selectedPlant.diagnosis || 'Looking perfect'}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 py-3 bg-accent text-black font-bold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent">
                    Water Now
                  </button>
                  <button className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors">
                    Ask AI Expert
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
