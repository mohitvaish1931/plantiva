import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Scan, Loader2, Sparkles, Send, Leaf, BrainCircuit, Mic, MicOff, Bug, Activity, Droplets, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils';
import { apiService, ChatMessage } from '../services/apiService';
import { scanHistoryService } from '../services/scanHistoryService';
import { LiveScanner } from '../components/camera/LiveScanner';
import { useVoiceCommands, VoiceAction } from '../hooks/useVoiceCommands';
import { ReportModal } from '../components/ReportModal';
import { useData } from '../context/DataContext';

type ScanMode = 'disease' | 'identity' | 'pest' | 'nutrition' | 'growth';

type ScanState = 'idle' | 'camera_active' | 'scanning' | 'results';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isRichResult?: boolean;
};

const SCAN_MODES: { id: ScanMode; icon: any; label: string }[] = [
  { id: 'disease', icon: Activity, label: 'Disease Detection' },
  { id: 'identity', icon: Scan, label: 'Plant Identity' },
  { id: 'pest', icon: Bug, label: 'Pest Detection' },
  { id: 'nutrition', icon: Droplets, label: 'Soil & Nutrition' },
  { id: 'growth', icon: Leaf, label: 'Growth Analysis' },
];

export function ScanPlantPage() {
  const { addPlant } = useData();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMode, setScanMode] = useState<ScanMode>('disease');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! Tap 'Open Camera' to start scanning. You can talk to me directly by tapping the microphone icon!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref for triggering capture from voice commands
  const captureFrameRef = useRef<() => string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string, imageToAnalyze?: string) => {
    if ((!content.trim() && !imageToAnalyze) || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim() || `Analyzing for ${SCAN_MODES.find(m => m.id === scanMode)?.label.toLowerCase()}...`,
      timestamp: new Date(),
      imageUrl: imageToAnalyze
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    if (imageToAnalyze) {
      setScanState('scanning');
    }

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Append mode context
      const contextualContent = `[Mode: ${scanMode}] ${content.trim() || 'Analyze this image.'}`;

      const response = await apiService.sendMessage(contextualContent, history, imageToAnalyze);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        isRichResult: !!imageToAnalyze // Treat direct image analysis as a rich result capable output
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (imageToAnalyze) {
        setScanState('results');
        
        // Save to My Collection
        addPlant({
          id: Date.now().toString(),
          name: 'Scanned Plant',
          species: scanMode === 'identity' ? 'Identified Species' : 'AI Analyzed',
          image: imageToAnalyze,
          healthScore: Math.floor(Math.random() * (100 - 65 + 1) + 65), // Simulated health score
          diagnosis: response.message.substring(0, 150) + '...',
          addedAt: new Date().toISOString(),
          timeline: [{
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            status: scanMode === 'disease' ? 'Diagnosed' : 'Scanned',
            healthScore: 85
          }]
        });

        // Save to history
        scanHistoryService.saveScan({
          imageUrl: imageToAnalyze,
          disease: scanMode === 'disease' ? 'Analysis Complete' : undefined,
          plantName: 'Scanned Plant',
          confidence: 'High'
        });

        // Automatically open the report modal to show generated tasks and details
        setIsReportOpen(true);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having a little trouble connecting to my neural network right now. Could you please try asking again?",
        timestamp: new Date(),
      }]);
      if (imageToAnalyze) {
        setScanState('results');
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleCapture = useCallback((dataUrl: string) => {
    setSelectedImage(dataUrl);
    setScanState('scanning');
    handleSendMessage(`Analyze this for ${SCAN_MODES.find(m => m.id === scanMode)?.label.toLowerCase()}`, dataUrl);
  }, [scanMode]);

  const handleVoiceCommand = useCallback((action: VoiceAction) => {
    switch (action.type) {
      case 'CAPTURE':
        setInputValue(prev => prev + " (Command: Capture Image) ");
        break;
      case 'SWITCH_CAMERA':
        setInputValue(prev => prev + " (Command: Switch Camera) ");
        break;
      case 'TOGGLE_FLASH':
        setInputValue(prev => prev + " (Command: Toggle Flash) ");
        break;
      case 'QUERY':
        if (scanState === 'camera_active') {
          handleSendMessage(action.payload);
        } else {
          handleSendMessage(action.payload);
        }
        break;
    }
  }, [scanState]);

  const { isListening, isSupported, toggleListening } = useVoiceCommands({
    onCommand: handleVoiceCommand
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        handleSendMessage('Please analyze this uploaded photo.', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetScan = () => {
    setScanState('idle');
    setSelectedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-8rem)] flex flex-col pb-6 space-y-6">
      
      {/* Header & Modes */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-light text-white mb-4">AI Scanner</h1>
          
          {/* Mode Selector */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 max-w-[600px]">
            {SCAN_MODES.map(mode => {
              const Icon = mode.icon;
              const isActive = scanMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setScanMode(mode.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap",
                    isActive 
                      ? "bg-accent/20 border-accent text-accent shadow-glow-accent" 
                      : "bg-card/50 border-border text-gray-400 hover:text-gray-200 hover:bg-card-hover"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {scanState === 'results' && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 transition-colors text-sm font-medium shadow-glow-accent"
            >
              <FileText className="w-4 h-4" />
              View Diagnostic Report
            </button>
            <button 
              onClick={() => setScanState('camera_active')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border hover:bg-card-hover transition-colors text-sm text-white"
            >
              <Scan className="w-4 h-4" />
              Scan Another
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Camera / Image View */}
        <div className="lg:col-span-5 flex flex-col min-h-0">
          <motion.div 
            layout
            className={cn(
              "relative rounded-3xl overflow-hidden glass-card border flex-1 flex flex-col items-center justify-center min-h-[400px] transition-colors",
              scanState === 'camera_active' ? "border-accent shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-black" : "border-border bg-black/40"
            )}
          >
            <AnimatePresence mode="wait">
              {scanState === 'idle' && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center p-8 w-full max-w-md"
                >
                  <div className="w-24 h-24 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6 shadow-glow-accent">
                    <Scan className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Initialize Scanner</h3>
                  <p className="text-gray-400 mb-8 text-sm leading-relaxed">Launch the AI-powered camera to detect diseases, analyze soil, or identify plants instantly.</p>
                  
                  <div className="flex flex-col gap-4 justify-center">
                    <button 
                      onClick={() => setScanState('camera_active')}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent text-black font-semibold px-6 py-4 rounded-2xl hover:bg-accent-secondary transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      Open Camera
                    </button>
                    <input 
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 bg-card border border-border text-white font-medium px-6 py-3 rounded-xl hover:bg-card-hover transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </button>
                  </div>
                </motion.div>
              )}

              {scanState === 'camera_active' && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <LiveScanner 
                    isActive={scanState === 'camera_active'} 
                    onCapture={handleCapture}
                  />
                  {/* Close Camera Button */}
                  <button 
                    onClick={resetScan}
                    className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-xs text-white z-30 hover:bg-white/20"
                  >
                    Close Camera
                  </button>
                </motion.div>
              )}

              {(scanState === 'scanning' || scanState === 'results') && selectedImage && (
                <motion.div 
                  key="active-scan"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <img src={selectedImage} alt="Scanning subject" className="w-full h-full object-cover" />
                  
                  {/* Scanning Overlay Effects */}
                  {scanState === 'scanning' && (
                    <>
                      <div className="absolute inset-0 bg-black/60" />
                      
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.3)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
                      
                      {/* Scanning Laser Line */}
                      <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                        className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_25px_5px_rgba(16,185,129,0.7)] z-10"
                      />

                      {/* AI analyzing badge */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20">
                        <div className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                        <div className="bg-black/80 backdrop-blur-md border border-accent/30 text-accent px-6 py-3 rounded-full flex flex-col items-center gap-1 shadow-glow-accent">
                          <span className="text-sm font-semibold tracking-wide uppercase">AI Engine Active</span>
                          <span className="text-xs text-accent/70">Analyzing via Plantiva Vision...</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Chat Results */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="flex-1 glass-card border border-border rounded-3xl overflow-hidden flex flex-col relative bg-card/30">
            
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Plantiva Assistant</h3>
                  <p className="text-xs text-accent flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Listening
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isSupported && (
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      isListening 
                        ? "bg-red-500/10 text-red-400 border-red-500/30" 
                        : "bg-card border-border text-gray-400 hover:text-white"
                    )}
                  >
                    {isListening ? <Mic className="w-3 h-3 animate-pulse" /> : <MicOff className="w-3 h-3" />}
                    {isListening ? 'Listening...' : 'Voice Commands'}
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex gap-4",
                      message.role === 'user' ? "ml-auto flex-row-reverse max-w-[85%]" : "max-w-[95%]"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
                      message.role === 'assistant' 
                        ? "bg-accent/10 border-accent/30 shadow-glow-accent" 
                        : "bg-white/10 border-white/20"
                    )}>
                      {message.role === 'assistant' ? <Leaf className="w-4 h-4 text-accent" /> : <div className="w-4 h-4 bg-gray-400 rounded-full" />}
                    </div>

                    {/* Bubble */}
                    <div className={cn(
                      "rounded-2xl p-4 text-sm leading-relaxed overflow-hidden",
                      message.role === 'user'
                        ? "bg-accent text-black font-medium"
                        : message.isRichResult 
                          ? "bg-card border border-accent/30 shadow-glow-accent/20 w-full" 
                          : "bg-card border border-border/50 text-gray-200"
                    )}>
                      {message.imageUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-black/20 shadow-lg">
                          <img src={message.imageUrl} alt="Uploaded" className="w-full max-w-[250px] h-auto object-cover" />
                        </div>
                      )}
                      
                      {message.role === 'user' ? (
                        message.content
                      ) : (
                        <div className={cn("markdown-body", message.isRichResult ? "text-gray-300 space-y-4" : "space-y-3")}>
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-2 marker:text-accent" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3 space-y-2 marker:text-accent" {...props} />,
                              li: ({node, ...props}) => <li {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-white mt-6 mb-3 border-b border-border/50 pb-2 flex items-center gap-2" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-lg font-medium text-accent mt-4 mb-2" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent/50 pl-4 italic text-gray-400 my-4" {...props} />
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 max-w-[85%]"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/30 shadow-glow-accent flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-accent" />
                    </div>
                    <div className="rounded-2xl p-4 bg-card border border-border/50 flex items-center gap-3 text-accent">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs font-medium">Processing scan data...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-xl shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening for commands..." : "Ask a follow up question..."}
                  className="w-full bg-card border border-border rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-2 rounded-xl bg-accent text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-secondary transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        plantName="Scanned Plant"
        image={selectedImage || ''}
        diagnosis={messages[messages.length - 1]?.content || 'Diagnosis pending...'}
        healthScore={85} // Ideally pulled from state, but mocked here to match collection logic
      />
    </div>
  );
}
