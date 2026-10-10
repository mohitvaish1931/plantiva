import React, { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import toast from 'react-hot-toast';
import { useData } from '../../context/DataContext';
import { greeting } from '../../utils';

const SEARCH_ROUTES: { keywords: string[]; path: string }[] = [
  { keywords: ['scan', 'camera', 'photo', 'disease', 'diagnos'], path: '/scan-plant' },
  { keywords: ['collection', 'my plant', 'history', 'plants'], path: '/my-collection' },
  { keywords: ['care', 'water', 'routine', 'task', 'schedule', 'fertil', 'prune'], path: '/plant-care' },
  { keywords: ['alert', 'warning', 'predict'], path: '/predictive-alerts' },
  { keywords: ['weather', 'environment', 'climate', 'humidity', 'temperature', 'location'], path: '/environment' },
  { keywords: ['report', 'analytics'], path: '/reports' },
  { keywords: ['setting', 'profile', 'name', 'logout', 'log out'], path: '/settings' },
];

interface TopHeaderProps {
  onMenuClick?: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { userName } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = SEARCH_ROUTES.find(r => r.keywords.some(k => q.includes(k)));
    if (match) {
      navigate(match.path);
    } else {
      // Anything else is a question for the AI expert.
      navigate('/ai-expert', { state: { question: query.trim() } });
    }
    setQuery('');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between gap-4 py-4 px-4 sm:px-8 bg-background/80 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-xl glass-card hover:bg-card-hover transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{greeting()}, <span className="text-accent">{userName.split(' ')[0]}!</span></span> <span className="text-xl">🌱</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-400 mt-1">AI-Powered care for healthier plants and a greener tomorrow.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative group hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-64 pl-10 pr-4 py-2 border border-border rounded-full leading-5 bg-card text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-all focus:w-72 shadow-glass"
            placeholder="Search or ask anything..."
          />
        </form>

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
