import { useState, useEffect, useCallback, useRef } from 'react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type VoiceAction = 
  | { type: 'CAPTURE' }
  | { type: 'SWITCH_CAMERA' }
  | { type: 'TOGGLE_FLASH' }
  | { type: 'QUERY'; payload: string }
  | { type: 'UNKNOWN'; payload: string };

interface UseVoiceCommandsProps {
  onCommand: (action: VoiceAction) => void;
}

export function useVoiceCommands({ onCommand }: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase().trim();
      
      console.log('[Voice Command Heard]:', transcript);

      if (
        transcript.includes('capture') || 
        transcript.includes('scan') || 
        transcript.includes('take a picture') ||
        transcript.includes('take photo')
      ) {
        onCommand({ type: 'CAPTURE' });
      } else if (
        transcript.includes('switch camera') || 
        transcript.includes('flip camera') ||
        transcript.includes('rotate camera')
      ) {
        onCommand({ type: 'SWITCH_CAMERA' });
      } else if (
        transcript.includes('flash') || 
        transcript.includes('torch') ||
        transcript.includes('light')
      ) {
        onCommand({ type: 'TOGGLE_FLASH' });
      } else {
        // Assume anything else is a query for the AI
        onCommand({ type: 'QUERY', payload: event.results[current][0].transcript });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice Command Error]:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Recognition already started', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening
  };
}
