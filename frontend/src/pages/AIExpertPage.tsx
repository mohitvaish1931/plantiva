import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Loader2, Leaf, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../utils';
import { apiService, ChatMessage } from '../services/apiService';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  "Why are my Monstera leaves turning yellow?",
  "How often should I water a Snake Plant?",
  "What's the optimal humidity for orchids?",
  "Identify common signs of overwatering."
];

export function AIExpertPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Plantiva, your AI Botanical Expert. I'm here to help you diagnose plant issues, optimize care routines, and answer any gardening questions. How can I help your collection thrive today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Map existing messages to ChatMessage format for context
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await apiService.sendMessage(content.trim(), history);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having a little trouble connecting to my neural network right now. Could you please try asking again?",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto h-[calc(100vh-8rem)] flex flex-col pb-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-glow-accent">
          <BrainCircuit className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-light text-white mb-1">AI Botanical Expert</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <p className="text-xs font-medium text-accent uppercase tracking-wider">Online & Ready</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-card border border-border rounded-3xl overflow-hidden flex flex-col relative">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : ""
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
                  "rounded-2xl p-4 text-sm leading-relaxed",
                  message.role === 'user'
                    ? "bg-accent text-black font-medium"
                    : "bg-card border border-border/50 text-gray-200"
                )}>
                  {message.role === 'user' ? (
                    message.content
                  ) : (
                    <div className="markdown-body space-y-4">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-medium text-white mt-4 mb-2" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-base font-medium text-white mt-3 mb-1" {...props} />,
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
                <div className="rounded-2xl p-4 bg-card border border-border/50 flex items-center gap-2 text-accent">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-medium">Analyzing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-xl">
          
          {/* Suggested Prompts (only show if few messages) */}
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-accent" />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
            <MessageSquare className="absolute left-4 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your plants..."
              className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-16 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 p-2.5 rounded-xl bg-accent text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-secondary transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
