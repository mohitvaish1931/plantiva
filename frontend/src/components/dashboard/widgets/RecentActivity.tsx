import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const scans = [
  { id: 1, date: 'Today, 09:41 AM', plant: 'Monstera Deliciosa', confidence: '98%', disease: 'None', treatment: '-', image: '/assets/images/plant_money_1785433553402.jpg', status: 'Healthy' },
  { id: 2, date: 'Yesterday, 14:20 PM', plant: 'Peace Lily', confidence: '92%', disease: 'Leaf Spot', treatment: 'Fungicide spray', image: '/assets/images/plant_peace_lily_1785433542912.jpg', status: 'Action Needed' },
  { id: 3, date: 'Mon, 10:15 AM', plant: 'Aloe Vera', confidence: '99%', disease: 'None', treatment: '-', image: '/assets/images/plant_aloe_vera_1785433518453.jpg', status: 'Healthy' },
];

export function RecentActivity() {
  return (
    <motion.div variants={itemVariants} className="glass-card p-0 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold tracking-wide text-gray-300">RECENT SCANS</h3>
      </div>

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
            {scans.map((scan, i) => (
              <tr key={scan.id} className="border-b border-border/10 hover:bg-card-hover/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={scan.image} alt={scan.plant} className="w-8 h-8 rounded-md object-cover border border-border" />
                    <span className="font-medium text-gray-200">{scan.plant}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{scan.date}</td>
                <td className="px-5 py-3 text-gray-300">{scan.disease}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-card rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: scan.confidence }} />
                    </div>
                    <span className="text-xs text-gray-400">{scan.confidence}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded-md border",
                    scan.status === 'Healthy' ? "bg-accent/10 border-accent/20 text-accent" : "bg-warning/10 border-warning/20 text-warning"
                  )}>
                    {scan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
