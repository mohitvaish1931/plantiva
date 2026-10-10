import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Scan, Send, Leaf, BrainCircuit, Mic, MicOff, Bug, Activity, Droplets, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn, compressImage } from '../utils';
import { apiService, ChatMessage, ScanAnalysis } from '../services/apiService';
import { LiveScanner } from '../components/camera/LiveScanner';
import { useVoiceCommands, VoiceAction } from '../hooks/useVoiceCommands';
import { ReportModal } from '../components/ReportModal';
import { useData } from '../context/DataContext';
import { Plant } from '../types';

type ScanMode = 'disease' | 'identity' | 'pest' | 'nutrition' | 'growth';

type ScanState = 'idle' | 'camera_active' | 'scanning' | 'results';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isRichResult?: boolean;
  isError?: boolean;
};

const SCAN_MODES: { id: ScanMode; icon: any; label: string }[] = [
  { id: 'disease', icon: Activity, label: 'Disease Detection' },
  { id: 'identity', icon: Scan, label: 'Plant Identity' },
  { id: 'pest', icon: Bug, label: 'Pest Detection' },
  { id: 'nutrition', icon: Droplets, label: 'Soil & Nutrition' },
  { id: 'growth', icon: Leaf, label: 'Growth Analysis' },
];

/** Used only when the AI reply has no structured block: read the report text instead of guessing. */
function analysisFromText(text: string): ScanAnalysis {
  const lower = text.toLowerCase();
  const confidenceMatch = text.match(/confidence[^0-9]{0,20}(\d{1,3})\s*%/i);
  const nameMatch = text.match(/plant identity[^:]*:\s*\**\s*([^\n*(,]+)/i);
  let healthScore = 75;
  if (/\b(critical|severe|dying|dead|rotting|advanced stage)\b/.test(lower)) healthScore = 40;
  else if (/\b(disease|infection|infected|blight|fungal|bacterial|pest|mites|aphids|deficien|spots?)\b/.test(lower)) healthScore = 62;
  else if (/\b(healthy|thriving|no signs of)\b/.test(lower)) healthScore = 90;
  return {
    plantName: nameMatch?.[1]?.trim().slice(0, 60) || 'Scanned Plant',
    species: 'Unknown',
    healthScore,
    confidence: confidenceMatch ? Math.min(100, Number(confidenceMatch[1])) : null,
    disease: 'See report',
    status: healthScore >= 80 ? 'Healthy' : healthScore >= 55 ? 'Needs Attention' : 'Critical',
  };
}

export function ScanPlantPage() {
  const { addPlant, locationContext } = useData();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMode, setScanMode] = useState<ScanMode>('disease');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [lastScan, setLastScan] = useState<Plant | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! Tap 'Open Camera' or 'Upload Photo' to scan a plant. You can also ask me questions or use voice commands with the microphone.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string, imageToAnalyze?: string) => {
    if ((!content.trim() && !imageToAnalyze) || isTyping) return;

    const modeLabel = SCAN_MODES.find(m => m.id === scanMode)?.label.toLowerCase();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim() || `Analyzing for ${modeLabel}...`,
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
      const history: ChatMessage[] = messages
        .filter(m => !m.isError)
        .map(m => ({ role: m.role, content: m.content }));

      // Smaller uploads are faster and well within what the vision model needs.
      const uploadImage = imageToAnalyze ? await compressImage(imageToAnalyze, 1280, 0.85) : undefined;

      const response = await apiService.sendMessage(
        `[Mode: ${scanMode}] ${content.trim() || 'Analyze this image.'}`,
        history,
        { imageDataUrl: uploadImage, locationContext, scanMode }
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        isRichResult: !!imageToAnalyze && !response.error,
        isError: !!response.error
      };

      setMessages(prev => [...prev, botMessage]);

      if (imageToAnalyze) {
        setScanState('results');
        // Don't put a failed scan into the collection.
        if (response.error) return;

        const fromText = analysisFromText(response.message);
        const analysis = response.analysis || fromText;
        const healthScore = analysis.healthScore ?? fromText.healthScore ?? 75;
        const thumbnail = await compressImage(imageToAnalyze, 360, 0.7);
        const now = new Date();
        const plant: Plant = {
          id: now.getTime().toString(),
          name: analysis.plantName && analysis.plantName !== 'Unknown' ? analysis.plantName : 'Scanned Plant',
          species: analysis.species && analysis.species !== 'Unknown' ? analysis.species : undefined,
          image: thumbnail,
          healthScore,
          confidence: analysis.confidence ?? fromText.confidence,
          disease: analysis.disease,
          status: analysis.status,
          scanMode,
          diagnosis: response.message,
          addedAt: now.toISOString(),
          timeline: [{
            id: now.getTime().toString(),
            date: now.toISOString().split('T')[0],
            status: scanMode === 'disease' ? 'Diagnosed' : 'Scanned',
            healthScore
          }]
        };

        addPlant(plant);
        setLastScan(plant);

        // Automatically open the report modal to show generated tasks and details
        setIsReportOpen(true);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I couldn't process that. Please try again.",
        timestamp: new Date(),
        isError: true,
      }]);
      if (imageToAnalyze) {
        setScanState('results');
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Camera and voice callbacks are memoised; always call the latest send function.
  const sendRef = useRef(handleSendMessage);
  sendRef.current = handleSendMessage;

  const handleCapture = useCallback((dataUrl: string) => {
    setSelectedImage(dataUrl);
    setScanState('scanning');
    sendRef.current(`Analyze this for ${SCAN_MODES.find(m => m.id === scanMode)?.label.toLowerCase()}`, dataUrl);
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
        sendRef.current(action.payload);
        break;
    }
  }, []);

  const { isListening, isSupported, toggleListening } = useVoiceCommands({
    onCommand: handleVoiceCommand
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
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
          <div className="flex flex-wrap gap-3">
            {lastScan && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 transition-colors text-sm font-medium shadow-glow-accent"
            >
              <FileText className="w-4 h-4" />
              View Diagnostic Report
            </button>
            )}
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
                        : message.isError
                          ? "bg-red-500/10 border border-red-500/30 text-gray-200"
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

      {lastScan && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          plantName={lastScan.name}
          species={lastScan.species}
          image={selectedImage || lastScan.image || ''}
          diagnosis={lastScan.diagnosis || 'Diagnosis pending...'}
          healthScore={lastScan.healthScore}
          confidence={lastScan.confidence}
          disease={lastScan.disease}
          status={lastScan.status}
        />
      )}
    </div>
  );
}
