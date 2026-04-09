import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  User,
  Heart
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface LandingScreenProps {
  onStart: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const [userName, setUserName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userName.trim();
    if (!trimmed) return;
    
    try {
      const user = await dataService.login(trimmed);
      localStorage.setItem('learnerbot_username', user.name);
      localStorage.setItem('learnerbot_plants', JSON.stringify(user.plants || []));
      setHasSubmitted(true);
      
      // Small delay for success animation
      setTimeout(() => {
        onStart();
      }, 900);
    } catch (err) {
      console.error("Login failed", err);
      // Fallback for demo
      localStorage.setItem('learnerbot_username', trimmed);
      setHasSubmitted(true);
      setTimeout(() => onStart(), 900);
    }
  };

  const disabled = !userName.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center px-4"
      style={{
        backgroundImage: 'url(/landing-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />

      {/* Main content - centered */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/40 mb-6 shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <p className="text-sm font-medium text-white uppercase tracking-wide">
              Plantiva · AI Botanical Assistant
            </p>
          </div>

          {/* Main heading */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="relative mb-8">
              {/* Dynamic Aura */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3] 
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-[-20px] bg-emerald-500/20 blur-[40px] rounded-full"
              />
              
              {/* Logo Frame */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-full p-2 border-4 border-white/20 shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden group"
              >
                <img 
                  src="/logo.png" 
                  alt="Plantiva Logo" 
                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700" 
                />
              </motion.div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-4 text-white drop-shadow-lg tracking-tighter">
              Plantiva<br />
              <span className="text-green-300">Scan & Cure</span>
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-white/95 max-w-xl mx-auto mb-8 drop-shadow-md font-medium">
            Identify and Treat Plant Diseases!
          </p>

          {/* Name form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/15 border border-white/30 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md mx-auto backdrop-blur-xl"
          >
            <p className="text-lg text-white/90 mb-4 flex items-center justify-center gap-2 font-semibold">
              <Heart className="w-5 h-5 text-red-300" />
              Welcome to Plantiva
            </p>

            <div className="relative mb-4">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="What's your name?"
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/20 text-white text-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 placeholder:text-white/50 transition-all backdrop-blur-sm"
                autoFocus
              />
            </div>

            <motion.button
              type="submit"
              disabled={disabled}
              whileHover={disabled ? {} : { scale: 1.05 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-lg transition-all border ${
                disabled
                  ? 'bg-white/20 text-white/50 border-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-white/30 shadow-xl hover:shadow-2xl'
              }`}
            >
              <span>{disabled ? 'Enter your name' : 'Start My Journey'}</span>
              {!disabled && <ArrowRight className="w-5 h-5" />}
            </motion.button>

            <p className="mt-3 text-sm text-white/70 text-center">
              I'll remember your name to sync your progress!
            </p>
          </motion.form>
        </motion.div>
      </div>

      {/* Success overlay when name accepted */}
      {hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-500/90 text-emerald-50 text-xs sm:text-sm shadow-lg border border-emerald-300/70 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Awesome, let&apos;s go, <span className="font-semibold">{userName.trim()}</span>!
        </motion.div>
      )}
    </motion.div>
  );
};

export default LandingScreen;
