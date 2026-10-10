import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { averageHealth, dayKey } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const row = payload[0].payload;
    return (
      <div className="bg-card/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-white text-xs font-semibold mb-2">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-gray-300">Health:</span>
          <span className="text-white font-medium">{row.health ?? '—'}{row.health != null ? '/100' : ''}</span>
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{row.scans} {row.scans === 1 ? 'scan' : 'scans'}</div>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart() {
  const { plants } = useData();

  const { data, trend } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
    const rows = days.map(date => {
      const key = dayKey(date);
      const dayPlants = plants.filter(p => dayKey(new Date(p.addedAt)) === key);
      return {
        name: date.toLocaleDateString([], { weekday: 'short' }),
        health: averageHealth(dayPlants),
        scans: dayPlants.length,
      };
    });

    const weekAgo = Date.now() - 7 * 86400000;
    const thisWeek = averageHealth(plants.filter(p => new Date(p.addedAt).getTime() > weekAgo));
    const lastWeek = averageHealth(plants.filter(p => {
      const t = new Date(p.addedAt).getTime();
      return t <= weekAgo && t > weekAgo - 7 * 86400000;
    }));
    return { data: rows, trend: thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null };
  }, [plants]);

  const hasData = data.some(d => d.health !== null);

  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gray-300">WEEKLY ANALYTICS</h3>
          <p className="text-xs text-gray-400 mt-1">Average health score of your scans, last 7 days</p>
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${trend >= 0 ? 'text-accent bg-accent/10 border-accent/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {trend >= 0 ? '+' : ''}{trend} vs last week
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[200px] w-full relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10">
            No scans in the last 7 days
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="health"
              connectNulls
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHealth)"
              dot={{ r: 3, strokeWidth: 0, fill: '#10B981' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981', className: "shadow-glow-accent" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="w-2 h-2 rounded-full bg-accent" /> Health Score
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {(() => {
            const total = data.reduce((n, d) => n + d.scans, 0);
            return `${total} ${total === 1 ? 'scan' : 'scans'} this week`;
          })()}
        </div>
      </div>
    </motion.div>
  );
}
