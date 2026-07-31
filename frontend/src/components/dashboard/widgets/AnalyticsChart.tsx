import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const data = [
  { name: 'Mon', health: 65, humidity: 40 },
  { name: 'Tue', health: 70, humidity: 45 },
  { name: 'Wed', health: 68, humidity: 50 },
  { name: 'Thu', health: 75, humidity: 55 },
  { name: 'Fri', health: 80, humidity: 60 },
  { name: 'Sat', health: 85, humidity: 65 },
  { name: 'Sun', health: 85, humidity: 60 },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl">
        <p className="text-white text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300 capitalize">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsChart() {
  return (
    <motion.div variants={itemVariants} className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-gray-300">WEEKLY ANALYTICS</h3>
          <p className="text-xs text-gray-400 mt-1">Plant health vs Humidity</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-md border border-accent/20">
          <TrendingUp className="w-3 h-3" /> +12% vs last week
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="humidity" 
              stroke="#3B82F6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorHumidity)" 
              activeDot={{ r: 4, strokeWidth: 0, fill: '#3B82F6' }}
            />
            <Area 
              type="monotone" 
              dataKey="health" 
              stroke="#10B981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorHealth)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981', className: "shadow-glow-accent" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="w-2 h-2 rounded-full bg-accent" /> Health Score
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className="w-2 h-2 rounded-full bg-blue" /> Env Humidity
        </div>
      </div>
    </motion.div>
  );
}
