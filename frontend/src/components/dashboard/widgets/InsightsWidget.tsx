import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, Shield, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import CountUp from 'react-countup';
import { useData } from '../../../context/DataContext';
import { averageHealth, plantStatus } from '../../../utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

type Period = 'week' | 'month' | 'all';
const PERIOD_DAYS: Record<Period, number | null> = { week: 7, month: 30, all: null };

export function InsightsWidget() {
  const { plants, alerts } = useData();
  const [period, setPeriod] = useState<Period>('week');

  const days = PERIOD_DAYS[period];
  const now = Date.now();
  const inRange = (iso: string, fromDaysAgo: number, toDaysAgo: number) => {
    const t = new Date(iso).getTime();
    return t <= now - toDaysAgo * 86400000 && t > now - fromDaysAgo * 86400000;
  };

  const current = days ? plants.filter(p => inRange(p.addedAt, days, 0)) : plants;
  const previous = days ? plants.filter(p => inRange(p.addedAt, days * 2, days)) : [];

  const healthy = current.filter(p => plantStatus(p) === 'Healthy').length;
  const healthyPct = current.length ? Math.round((healthy / current.length) * 100) : 0;
  const careScore = averageHealth(current);
  const activeAlerts = alerts.filter(a => a.type !== 'resolved').length;

  let scanTrend: string | undefined;
  let scanTrendUp = true;
  if (days && (current.length || previous.length)) {
    const diff = current.length - previous.length;
    scanTrendUp = diff >= 0;
    scanTrend = `${diff >= 0 ? '+' : ''}${diff}`;
  }
  const periodLabel = period === 'week' ? 'vs last week' : period === 'month' ? 'vs last month' : '';

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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="bg-card border border-border text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InsightStat
            icon={Scan}
            label="Total Scans"
            value={current.length}
            trend={scanTrend}
            trendUp={scanTrendUp}
            subtitle={periodLabel}
          />
          <InsightStat
            icon={Shield}
            label="Healthy Plants"
            value={healthy}
            subtitle={current.length ? `${healthyPct}% of scanned plants` : 'No scans yet'}
          />
          <InsightStat
            icon={AlertTriangle}
            label="Active Alerts"
            value={activeAlerts}
            subtitle={activeAlerts ? 'See Predictive Alerts' : 'All clear'}
            iconColor="text-warning"
          />
          <InsightStat
            icon={Activity}
            label="Care Score"
            value={careScore ?? 0}
            subtitle={careScore === null ? 'Scan a plant to start' : careScore >= 80 ? 'Great job! Keep it up.' : 'Room to improve'}
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
            <CountUp end={value} duration={1.5} separator="," preserveValue />
            {isScore && <span className="text-sm text-gray-500 font-normal">/100</span>}
          </span>
        </div>
        {(trend || subtitle) && (
          <p className="text-[10px] mt-1 flex items-center gap-1">
            {trend && (
              <span className={trendUp ? "text-accent" : "text-red"}>
                {trendUp ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                {trend}
              </span>
            )}
            <span className="text-gray-500">{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
