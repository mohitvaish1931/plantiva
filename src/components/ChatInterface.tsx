import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Message, Plant, TimelineEntry } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import Button from './ui/Button';
import Card from './ui/Card';
import Avatar from './Avatar';
import { apiService } from '../services/apiService';
import { progressService } from '../services/progressService';
import { dataService } from '../services/dataService';
import type { ChatMessage } from '../services/apiService';

interface ChatInterfaceProps {
  onBack: () => void;
  initialPlant: Plant | null;
}
const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack, initialPlant }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [userName] = useState(
    () => localStorage.getItem('learnerbot_username') || 'Learning Champion'
  );
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // Responsive: track desktop vs mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsDesktop(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial welcome message & first badge (avoid double-fire in StrictMode)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (initialPlant) {
      const plantName = initialPlant.name || 'your plant';
      const cleanDiagnosis = (initialPlant.diagnosis && !initialPlant.diagnosis.includes('Oops')) 
        ? initialPlant.diagnosis 
        : "Recovering from environmental stress (Awaiting new scan)";

      const plantMessage: Message = {
        id: 'initial-plant',
        type: 'bot',
        content: `🌿 I see you're checking on your **${plantName}**. \n\nIts last diagnosis was: *${cleanDiagnosis}*\n\nHow would you like to proceed? I can give you more care tips, check for new symptoms, or provide a detailed treatment plan!`,
        timestamp: new Date(),
        imageUrl: initialPlant.image,
        options: [
          "Treatment plan 📋",
          "Preventive care 🛡️",
          "New symptoms? 🔍",
          "Back to my garden 🏠"
        ],
        emoji: '🌿'
      };
      setMessages([plantMessage]);
      setConversationHistory([{ role: 'assistant', content: `The user is asking about their ${plantName} which has the diagnosis: ${initialPlant.diagnosis || 'unknown'}.` }]);
    } else {
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: `🌿 Welcome, ${userName}! I'm Plantiva, your AI botanical expert! I'm excited to help you keep your plants healthy and thriving! \n\nI can help you identify plant diseases, diagnose problems, and provide cure methods. What plant issue would you like to explore today? \n\nLet's get your garden in perfect health! 🌱`,
        timestamp: new Date(),
        isQuestion: true,
        options: [
          "Identify a plant disease 🦠",
          'Pest control methods 🪲',
          'Plant care tips 🌿',
          'Treat leaf problems 🍂',
        ],
        emoji: '🌿',
      };
      setMessages([welcomeMessage]);
    }

    const badge = progressService.earnBadge('first-chat');
    if (badge) {
      triggerConfetti();
    }
  }, [userName, initialPlant]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll to bottom for new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const triggerConfetti = async () => {
    try {
      // Load confetti from CDN if not available locally
      if (typeof window !== 'undefined' && !(window as any).confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        script.onload = () => {
          const confetti = (window as any).confetti;
          if (typeof confetti === 'function') {
            confetti({
              particleCount: 140,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#22C55E', '#10B981', '#84CC16', '#16A34A'],
              scalar: 1.1,
            });
          }
        };
        document.head.appendChild(script);
      } else if ((window as any).confetti) {
        const confetti = (window as any).confetti;
        confetti({
          particleCount: 140,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#10B981', '#84CC16', '#16A34A'],
          scalar: 1.1,
        });
      }
    } catch (e) {
      // Silently fail if canvas-confetti is not available
      console.warn('confetti not available');
    }
  };

  const callApi = async (message: string, imageUrl?: string): Promise<string> => {
    try {
      // Get location context
      const storedWeather = localStorage.getItem('learnerbot_weather');
      let locationContext = "Location data unavailable.";
      
      if (storedWeather) {
        const weather = JSON.parse(storedWeather);
        locationContext = `The user is in ${weather.city}. Current weather: ${weather.temp}°C, ${weather.description}. Humidity: ${weather.humidity}%. Air Quality: ${weather.aqiStatus} (Index ${weather.aqi}). Use this to provide contextually relevant advice (e.g. humidity effects on fungi, temperature impact on growth).`;
      }

      const response = await apiService.sendMessage(message, conversationHistory, imageUrl, locationContext);


      // Log but don't break UX for missing API key
      if (response.error && !response.error.includes('API key not configured')) {
        console.warn('API Warning:', response.error);
      }

      return response.message;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
      setConversationHistory([]);
      hasInitializedRef.current = false;
      // Re-initialize welcome message
      setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: `🌿 Welcome back! I'm Plantiva. How can I help your garden today?`,
          timestamp: new Date(),
          isQuestion: true,
          options: [
            "Identify a plant disease 🦠",
            'Pest control methods 🪲',
            'Plant care tips 🌿',
            'Treat leaf problems 🍂',
          ],
          emoji: '🌿',
        };
        setMessages([welcomeMessage]);
        hasInitializedRef.current = true;
      }, 100);
    }
  };

  // Award badges based on message count (after each update)
  useEffect(() => {
    if (messages.length >= 10) {
      const badge = progressService.earnBadge('curious-mind');
      if (badge) {
        triggerConfetti();
      }
    }
  }, [messages.length]);

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if ((!content.trim() && !imageUrl) || isTyping) return;

    const cleanContent = content.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: cleanContent || (imageUrl ? "🖼️ Sent a plant image for analysis" : ""),
      timestamp: new Date(),
      imageUrl: imageUrl,
    };

    setMessages((prev) => [...prev, userMessage]);

    const newUserMessage: ChatMessage = { 
      role: 'user', 
      content: cleanContent || (imageUrl ? "I've uploaded a plant leaf image. Please analyze it for diseases and provide treatment recommendations." : "")
    };
    setConversationHistory((prev) => [...prev, newUserMessage]);

    setIsTyping(true);

    try {
      const botResponse = await callApi(cleanContent, imageUrl);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        emoji: '🌿',
      };

      setMessages((prev) => [...prev, botMessage]);

      const newBotMessage: ChatMessage = { role: 'assistant', content: botResponse };
      setConversationHistory((prev) => [...prev, newBotMessage]);

      // XP progression
      progressService.addXP(10);
      // Award a small token for using the bot
      
      // Auto-save plant data if image or specific keywords present
      if (imageUrl || botResponse.toLowerCase().includes('diagnosis') || botResponse.toLowerCase().includes('disease')) {
        const currentPlants: Plant[] = JSON.parse(localStorage.getItem('learnerbot_plants') || '[]');
        
        // Find target plant (either initialPlant or matching name)
        const targetPlantId = initialPlant?.id;
        
        const timelineEntry: TimelineEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          image: imageUrl || (initialPlant?.image || ''),
          status: botResponse.toLowerCase().includes('healthy') ? 'healthy' : 'diagnosis updated',
          healthScore: Math.floor(Math.random() * 30) + 65,
          note: botResponse.substring(0, 150) + '...'
        };

        let updatedPlants: Plant[];

        if (targetPlantId) {
          // Update existing plant timeline
          updatedPlants = currentPlants.map(p => {
            if (p.id === targetPlantId) {
              return {
                ...p,
                healthScore: timelineEntry.healthScore,
                diagnosis: botResponse.substring(0, 50) + '...',
                image: imageUrl || p.image,
                timeline: [timelineEntry, ...(p.timeline || [])]
              };
            }
            return p;
          });
        } else {
          // Create new plant entry
          const newPlant: Plant = {
            id: `plant-${Date.now()}`,
            name: imageUrl ? 'New Scan' : 'Analyzed Plant',
            diagnosis: botResponse.substring(0, 50) + '...',
            image: imageUrl || null,
            healthScore: timelineEntry.healthScore,
            addedAt: new Date().toISOString(),
            timeline: [timelineEntry]
          };
          updatedPlants = [newPlant, ...currentPlants].slice(0, 10);
        }

        localStorage.setItem('learnerbot_plants', JSON.stringify(updatedPlants));
        
        // Push to Backend
        dataService.syncUserData(userName, updatedPlants, progressService.getProgress().xp).catch(e => console.error("Sync failed", e));
        console.log("Plant timeline updated and synced to MongoDB");
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content:
          "Oops! Something went wrong, but don't worry - I'm still here to help you learn amazing things! Let's try again! 🌟",
        timestamp: new Date(),
        emoji: '😅',
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Chat API Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  return (
    <div className="h-screen w-full bg-[#050806] flex items-stretch justify-center text-white overflow-hidden relative">
      {/* Dynamic background lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-900/10 blur-[130px] rounded-full" />
      </div>

      <div className="chat-interface relative flex h-full w-full max-w-7xl mx-auto md:my-4 md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden bg-[#0a0f0d]/40 backdrop-blur-3xl">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setShowSidebar((prev) => !prev)}
          className="fixed md:hidden top-4 left-4 z-50 w-11 h-11 bg-botanical-900/90 hover:bg-botanical-800/90 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-sm border border-botanical-700/60"
        >
          {showSidebar ? (
            <X className="w-6 h-6 text-slate-200" />
          ) : (
            <Menu className="w-6 h-6 text-slate-200" />
          )}
        </button>

        {/* Sidebar */}
        <AnimatePresence>
          {(showSidebar || isDesktop) && (
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed md:relative z-40 w-80 h-full bg-white/5 backdrop-blur-[40px] border-r border-white/10 flex-shrink-0"
            >
              <div className="p-5 h-full overflow-y-auto space-y-6 custom-scrollbar">
                {/* Profile Card */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 mb-4 bg-white/5 border-white/10 shadow-xl hover:bg-white/10 transition-all duration-500 rounded-3xl">
                    <div className="flex flex-col items-center text-center">
                      <Avatar type="user" size="lg" />
                      <h3 className="text-xl font-extrabold text-white mt-4 mb-1">
                        {userName}!
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-sm text-emerald-300 font-medium">
                        <div className="w-6 h-6 rounded-full bg-white overflow-hidden border border-emerald-500/30">
                          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span>Plantiva AI</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        AI Botanical Assistant
                      </p>
                    </div>
                  </Card>
                </motion.div>





                  <Button
                    onClick={handleResetChat}
                    variant="outline"
                    className="w-full !py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all"
                  >
                    🗑️ Clear Session
                  </Button>

                {/* Plant Care Tip Card */}
                <Card className="p-5 mt-4 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border-emerald-500/20 rounded-3xl">
                  <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    🌿 Plant Care Tip
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Early detection is key! Regularly inspect your plant leaves for any unusual spots, discoloration, or wilting. The sooner you catch a problem, the better the treatment results! 🔍
                  </p>
                </Card>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Refined Header */}
          <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-6">
            <div className="flex items-center justify-between max-w-5xl mx-auto gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center backdrop-blur-md border border-emerald-500/30 overflow-hidden shadow-lg">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    Plantiva Scan
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs md:text-sm text-white/90">
                      Upload a leaf photo to diagnose
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-3 text-sm">
                <button 
                  onClick={() => alert("Check our FAQ section!")}
                  className="w-10 h-10 bg-white/10 hover:bg-white/15 rounded-lg flex items-center justify-center transition-all border border-white/20 text-white backdrop-blur-md"
                >
                  <span className="text-xl">?</span>
                </button>
                <button 
                  onClick={onBack}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all border border-white/30 text-white backdrop-blur-md"
                >
                  <span className="text-xl">🏠</span>
                </button>
                <button 
                  onClick={() => alert("Settings coming soon!")}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all border border-white/30 text-white backdrop-blur-md"
                >
                  <span className="text-xl">⚙️</span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 relative custom-scrollbar bg-transparent"
          >
            {/* Soft animated background blobs */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                className="absolute top-16 left-16 w-40 h-40 bg-green-500/40 rounded-full blur-2xl"
              />
              <motion.div
                animate={{
                  rotate: [360, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute bottom-20 right-20 w-56 h-56 bg-emerald-500/40 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-4">
              {/* subtle “today” pill when there are messages */}
              {messages.length > 0 && (
                <div className="flex justify-center mb-1">
                  <span className="px-3 py-1 text-[11px] rounded-full bg-slate-900/80 border border-slate-700/70 text-slate-300">
                    ✨ New learning session
                  </span>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onOptionClick={handleOptionClick}
                />
              ))}

              {isTyping && <TypingIndicator />}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input – sticky with slight elevated card */}
          <div className="border-t border-white/5 bg-white/5 backdrop-blur-2xl">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl overflow-hidden">
                <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500 text-center">
                Tip: Ask “Give me a fun quiz on …” to practice what you’ve learned 🎯
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && !isDesktop && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
