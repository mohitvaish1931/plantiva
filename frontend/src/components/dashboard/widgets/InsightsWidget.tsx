import React from 'react';
import { motion } from 'framer-motion';
import { Scan, Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import CountUp from 'react-countup';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function InsightsWidget() {
  return (
    <motion.div variants={itemVariants} className="glass-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
      <div 
        className="absolute right-0 top-0 bottom-0 w-64 bg-cover bg-left opacity-30 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: 'url("/assets/images/plant_aloe_vera_1785433518453.jpg")' }}
      />
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold tracking-wide text-white">PLANTIVA INSIGHTS</h3>
          <select className="bg-card border border-border text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent cursor-pointer">
            <option>This Week</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InsightStat 
            icon={Scan} 
            label="Total Scans" 
            value={24} 
            trend="+18%" 
            trendUp={true} 
          />
          <InsightStat 
            icon={Shield} 
            label="Healthy Plants" 
            value={18} 
            subtitle="75% of your collection" 
          />
          <InsightStat 
            icon={AlertTriangle} 
            label="Alerts Triggered" 
            value={3} 
            trend="-25%" 
            trendUp={true} 
            iconColor="text-warning"
          />
          <InsightStat 
            icon={Activity} 
            label="Care Score" 
            value={85} 
            subtitle="Great job! Keep it up." 
            isScore
          />
        </div>
      </div>
    </motion.div>
  );
}

function InsightStat({ icon: Icon, label, value, trend, trendUp, subtitle, iconColor = "text-accent", isScore }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-xl bg-card border border-border/50">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white">
            <CountUp end={value} duration={2} separator="," />
            {isScore && <span className="text-sm text-gray-500 font-normal">/100</span>}
          </span>
        </div>
        {(trend || subtitle) && (
          <p className="text-[10px] mt-1 flex items-center gap-1">
            {trend && (
              <span className={trendUp ? "text-accent" : "text-red"}>
                {trendUp ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : null}
                {trend}
              </span>
            )}
            <span className="text-gray-500">{subtitle || "vs last week"}</span>
          </p>
        )}
      </div>
    </div>
  );
}
