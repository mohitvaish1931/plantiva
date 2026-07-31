import React from 'react';
import { motion } from 'framer-motion';
import { WeatherCard } from './widgets/WeatherCard';
import { RoutineCard } from './widgets/RoutineCard';
import { ScanCard } from './widgets/ScanCard';
import { ExpertCard } from './widgets/ExpertCard';
import { MapCard } from './widgets/MapCard';
import { CollectionCard } from './widgets/CollectionCard';
import { InsightsWidget } from './widgets/InsightsWidget';
import { HealthScoreCard } from './widgets/HealthScoreCard';
import { AnalyticsChart } from './widgets/AnalyticsChart';
import { PredictionCard } from './widgets/PredictionCard';
import { CareCalendar } from './widgets/CareCalendar';
import { Recommendations } from './widgets/Recommendations';
import { RecentActivity } from './widgets/RecentActivity';
import { LiveCameraWidget } from './widgets/LiveCameraWidget';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export function Dashboard() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1600px] mx-auto space-y-6 pb-20"
    >
      {/* Top Row: Weather, Routine, Scan, Expert */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <WeatherCard />
        </div>
        <div className="lg:col-span-1">
          <RoutineCard />
        </div>
        <div className="lg:col-span-1">
          <ScanCard />
        </div>
        <div className="lg:col-span-1">
          <ExpertCard />
        </div>
      </div>

      {/* Row 2: Map, Health Score, Predictive Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MapCard />
        </div>
        <div className="lg:col-span-1">
          <HealthScoreCard />
        </div>
        <div className="lg:col-span-1">
          <PredictionCard />
        </div>
      </div>

      {/* Row 3: Insights (Full Width) */}
      <div className="grid grid-cols-1 gap-6">
        <InsightsWidget />
      </div>

      {/* Row 4: Analytics, Recommendations, Care Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart />
        </div>
        <div className="lg:col-span-1">
          <Recommendations />
        </div>
        <div className="lg:col-span-1">
          <CareCalendar />
        </div>
      </div>

      {/* Row 5: Recent Activity & Live Camera */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="lg:col-span-1">
          <LiveCameraWidget />
        </div>
      </div>

      {/* Row 6: Collection */}
      <div className="grid grid-cols-1 gap-6">
        <CollectionCard />
      </div>

    </motion.div>
  );
}
