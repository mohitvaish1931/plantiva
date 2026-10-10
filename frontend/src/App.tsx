import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Dashboard } from './components/dashboard/Dashboard';
import { DataProvider } from './context/DataContext';
import { getStoredUserName } from './services/session';

// Import all pages
import { ScanPlantPage } from './pages/ScanPlantPage';
import { MyCollectionPage } from './pages/MyCollectionPage';
import { PlantCarePage } from './pages/PlantCarePage';
import { AIExpertPage } from './pages/AIExpertPage';
import { PredictiveAlertsPage } from './pages/PredictiveAlertsPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from 'react-hot-toast';
import LandingScreen from './components/LandingScreen';

function Shell() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  React.useEffect(() => setMobileNavOpen(false), [location.pathname]);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-accent/30 selection:text-accent-secondary">

      {/* Fixed Sidebar */}
      <div className="hidden lg:block w-72 shrink-0 h-full border-r border-border bg-card/30 backdrop-blur-3xl relative z-20">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setMobileNavOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 w-full min-w-0">

        {/* Top Navigation */}
        <div className="shrink-0 border-b border-border bg-background/50 backdrop-blur-xl z-20 sticky top-0">
          <TopHeader onMenuClick={() => setMobileNavOpen(true)} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background relative">
          <main className="p-4 sm:p-6 md:p-8 min-h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan-plant" element={<ScanPlantPage />} />
              <Route path="/my-collection" element={<MyCollectionPage />} />
              <Route path="/plant-care" element={<PlantCarePage />} />
              <Route path="/ai-expert" element={<AIExpertPage />} />
              <Route path="/predictive-alerts" element={<PredictiveAlertsPage />} />
              <Route path="/environment" element={<EnvironmentPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'rgba(16,20,18,0.9)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }
      }}/>
    </div>
  );
}

function App() {
  const [showLanding, setShowLanding] = React.useState(!getStoredUserName());

  if (showLanding) {
    return (
      <LandingScreen
        onStart={() => {
          setShowLanding(false);
          window.location.reload(); // Reload to initialize DataContext properly
        }}
      />
    );
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
