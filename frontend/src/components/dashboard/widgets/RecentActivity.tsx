import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatScanDate, plantStatus } from '../../../utils';
import { useData } from '../../../context/DataContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1545241047-6083a36a1d18?w=200&q=60';

export function RecentActivity() {
  const { plants } = useData();
  const navigate = useNavigate();
  const scans = plants.slice(0, 5);

  return (
    <motion.div variants={itemVariants} className="glass-card p-0 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">RECENT SCANS</h3>
        {plants.length > 0 && (
          <button
            onClick={() => navigate('/my-collection')}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {scans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
          <ScanLine className="w-10 h-10 text-accent/60" />
          <p className="text-sm text-gray-400">No scans yet. Your scan history will appear here.</p>
          <button
            onClick={() => navigate('/scan-plant')}
            className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:bg-accent-secondary transition-colors"
          >
            Scan a plant
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 text-xs text-gray-500">
                <th className="px-5 py-3 font-medium">Plant</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Disease</th>
                <th className="px-5 py-3 font-medium">Confidence</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {scans.map((scan) => {
                const status = plantStatus(scan);
                const confidence = typeof scan.confidence === 'number' ? `${scan.confidence}%` : null;
                return (
                  <tr
                    key={scan.id}
                    onClick={() => navigate('/my-collection', { state: { plantId: scan.id } })}
                    className="border-b border-border/10 hover:bg-card-hover/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={scan.image || FALLBACK_IMAGE} alt={scan.name} className="w-8 h-8 rounded-md object-cover border border-border" />
                        <span className="font-medium text-gray-200 whitespace-nowrap">{scan.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatScanDate(scan.addedAt)}</td>
                    <td className="px-5 py-3 text-gray-300">{scan.disease || '—'}</td>
                    <td className="px-5 py-3">
                      {confidence ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-card rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: confidence }} />
                          </div>
                          <span className="text-xs text-gray-400">{confidence}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "text-[10px] px-2 py-1 rounded-md border whitespace-nowrap",
                        status === 'Healthy' ? "bg-accent/10 border-accent/20 text-accent"
                          : status === 'Critical' ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-warning/10 border-warning/20 text-warning"
                      )}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
