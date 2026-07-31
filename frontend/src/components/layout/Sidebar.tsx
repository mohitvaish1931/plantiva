import React from 'react';
import { cn } from '../../utils';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Scan, 
  Library, 
  HeartPulse, 
  BrainCircuit, 
  BellRing, 
  CloudSun, 
  FileText, 
  Settings,
  ChevronRight,
  Leaf
} from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Scan, label: 'Scan Plant', path: '/scan-plant' },
  { icon: Library, label: 'My Collection', path: '/my-collection' },
  { icon: HeartPulse, label: 'Plant Care', path: '/plant-care' },
  { icon: BrainCircuit, label: 'AI Expert', path: '/ai-expert' },
  { icon: BellRing, label: 'Predictive Alerts', path: '/predictive-alerts' },
  { icon: CloudSun, label: 'Environment', path: '/environment' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen border-r border-border bg-background flex flex-col p-4 z-50 sticky top-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <img src="/logo.png" alt="Plantiva Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-lg tracking-wide uppercase text-white">Plantiva</span>
        <div className="ml-auto w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center cursor-pointer hover:bg-card-hover transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium",
              isActive 
                ? "bg-accent/10 text-accent shadow-glow-accent border border-accent/20" 
                : "text-gray-400 hover:text-white hover:bg-card-hover"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Premium Card */}
      <div className="mt-auto mb-4 p-4 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 to-transparent relative overflow-hidden group cursor-pointer">
        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <h4 className="font-semibold text-accent text-sm mb-1">Go Premium</h4>
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">Unlock advanced AI insights and unlimited scans.</p>
        <button className="text-xs font-medium bg-accent text-black px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent-secondary transition-colors relative z-10">
          Upgrade Now <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Profile */}
      <div className="p-3 rounded-xl glass-card flex items-center gap-3 cursor-pointer hover:bg-card-hover transition-colors">
        <img 
          src="/assets/images/expert_avatar_1785433498995.jpg" 
          alt="Mohit" 
          className="w-10 h-10 rounded-full object-cover border border-border"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">Mohit Lalwani</p>
          <p className="text-xs text-accent truncate">Premium Plan</p>
        </div>
      </div>
    </motion.aside>
  );
}
