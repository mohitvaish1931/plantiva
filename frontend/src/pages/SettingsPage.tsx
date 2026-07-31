import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Bell, Shield, Smartphone } from 'lucide-react';
import { cn } from '../utils';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'devices'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'devices', label: 'Devices', icon: Smartphone },
  ] as const;

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences and connected devices.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  isActive 
                    ? "bg-white/10 text-white shadow-lg border border-white/10" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <tab.icon className={cn("w-5 h-5", isActive ? "text-accent" : "text-gray-500")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 glass-card border border-border rounded-3xl p-6 sm:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-medium text-white mb-6">Profile Settings</h2>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-blue-500 p-1">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors mb-2">
                      Change Avatar
                    </button>
                    <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Full Name</label>
                    <input type="text" defaultValue="Mohit Vaish" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Email Address</label>
                    <input type="email" defaultValue="mohit@example.com" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all" />
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 flex justify-end">
                  <button className="px-6 py-2.5 bg-accent text-black font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-glow-accent">
                    Save Changes
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-medium text-white mb-6">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {[
                    { title: 'Watering Reminders', desc: 'Get notified when plants need water' },
                    { title: 'Critical Alerts', desc: 'Extreme temperature or humidity warnings' },
                    { title: 'Weekly Reports', desc: 'Summary of your garden health' },
                    { title: 'AI Suggestions', desc: 'Proactive tips from Plantiva' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <div className="relative inline-block w-12 h-6 rounded-full bg-accent/20 cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-accent transition-transform transform translate-x-6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'devices' && (
              <motion.div
                key="devices"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white">Connected Devices</h2>
                  <button className="text-sm font-medium text-accent hover:text-white transition-colors">
                    + Add Device
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">Smart Sensor Hub V2</p>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/20 text-green-400">Online</span>
                      </div>
                      <p className="text-sm text-gray-500">Living Room • Last synced 2m ago</p>
                    </div>
                    <button className="text-gray-500 hover:text-red-400 transition-colors p-2">Remove</button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
