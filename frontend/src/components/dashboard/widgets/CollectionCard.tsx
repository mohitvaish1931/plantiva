import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function CollectionCard() {
  const { plants } = useData();
  const displayPlants = plants.slice(0, 4);

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">MY COLLECTION</h3>
        <button className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-3">
        {displayPlants.map((plant) => (
          <motion.div 
            key={plant.id}
            whileHover={{ y: -5 }}
            className="group cursor-pointer flex flex-col"
          >
            <div className="flex-1 rounded-xl overflow-hidden mb-2 relative border border-border/50 h-24">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url("${plant.image || 'https://images.unsplash.com/photo-1545241047-6083a36a1d18?w=500&q=80'}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h4 className="text-xs font-medium text-white truncate">{plant.name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${plant.healthScore > 80 ? 'bg-accent' : 'bg-warning'}`} />
              <span className="text-[10px] text-gray-400">{plant.healthScore > 80 ? 'Healthy' : 'Needs Care'}</span>
            </div>
          </motion.div>
        ))}
        {displayPlants.length === 0 && (
          <div className="col-span-4 text-center py-6 text-gray-500 text-sm border border-dashed border-border rounded-xl">
            No plants yet. Scan a plant!
          </div>
        )}
      </div>
    </motion.div>
  );
}
