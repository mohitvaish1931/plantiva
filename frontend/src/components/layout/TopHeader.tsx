import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';

export function TopHeader() {
  const [hasNotifPermission, setHasNotifPermission] = useState(notificationService.getPermissionStatus() === 'granted');

  const handleNotificationClick = async () => {
    if (hasNotifPermission) {
      toast('Notifications are already active!', { icon: '🌿' });
      return;
    }
    const granted = await notificationService.requestPermission();
    setHasNotifPermission(granted);
    if (granted) {
      toast.success('Alert notifications enabled! 🌿', {
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' }
      });
    } else {
      toast.error('Notification permission denied.');
    }
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between py-6 px-8 sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
    >
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
          Good Morning, <span className="text-accent">Mohit!</span> <span className="text-xl">🌱</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI-Powered care for healthier plants and a greener tomorrow.</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            className="block w-64 pl-10 pr-12 py-2 border border-border rounded-full leading-5 bg-card text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-all focus:w-72 shadow-glass"
            placeholder="Search anything..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-xs font-mono bg-background border border-border px-1.5 py-0.5 rounded">⌘K</span>
          </div>
        </div>

        {/* Notification */}
        <button 
          onClick={handleNotificationClick}
          className="relative p-2 rounded-full glass-card hover:bg-card-hover transition-colors group"
          title={hasNotifPermission ? "Notifications Active" : "Enable Notifications"}
        >
          <Bell className={`w-5 h-5 transition-colors ${hasNotifPermission ? 'text-accent' : 'text-gray-300 group-hover:text-white'}`} />
          {!hasNotifPermission && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red ring-2 ring-background"></span>}
        </button>
      </div>
    </motion.header>
  );
}
