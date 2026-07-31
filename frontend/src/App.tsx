import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Dashboard } from './components/dashboard/Dashboard';
import { DataProvider } from './context/DataContext';

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

function App() {
  const [showLanding, setShowLanding] = React.useState(!localStorage.getItem('learnerbot_username'));

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
        <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-accent/30 selection:text-accent-secondary">
          
          {/* Fixed Sidebar */}
          <div className="hidden lg:block w-72 shrink-0 h-full border-r border-border bg-card/30 backdrop-blur-3xl relative z-20">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full relative z-10 w-full min-w-0">
            
            {/* Top Navigation */}
            <div className="h-20 shrink-0 border-b border-border bg-background/50 backdrop-blur-xl z-20 sticky top-0">
              <TopHeader />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background relative">
              <main className="p-6 md:p-8 min-h-full">
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
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;