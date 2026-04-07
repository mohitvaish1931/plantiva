import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingScreen from './components/LandingScreen';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard.tsx';

type Screen = 'landing' | 'chat' | 'dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(
    localStorage.getItem('learnerbot_username') ? 'dashboard' : 'landing'
  );

  const [selectedPlant, setSelectedPlant] = useState<any>(null);

  const handleStart = () => {
    setCurrentScreen('dashboard');
  };

  const handleShowChat = (plant?: any) => {
    setSelectedPlant(plant || null);
    setCurrentScreen('chat');
  };

  const handleBackToDashboard = () => {
    setSelectedPlant(null);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('learnerbot_username');
    localStorage.removeItem('learnerbot_plants');
    localStorage.removeItem('learnerbot_progress');
    setSelectedPlant(null);
    setCurrentScreen('landing');
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <LandingScreen key="landing" onStart={handleStart} />
        )}
        
        {currentScreen === 'dashboard' && (
          <Dashboard 
            key="dashboard" 
            onStartChat={handleShowChat} 
            onLogout={handleLogout}
          />
        )}
        
        {currentScreen === 'chat' && (
          <ChatInterface 
            key="chat" 
            onBack={handleBackToDashboard} 
            initialPlant={selectedPlant}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;