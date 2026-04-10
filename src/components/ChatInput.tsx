import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, ImageIcon, Camera } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !disabled) {
      onSendMessage(message, selectedImage || undefined);
      setMessage('');
      setSelectedImage(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize and compress
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Output highly compressed JPEG (70% quality)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setSelectedImage(compressedBase64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="bg-transparent">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-4 max-w-xs mx-auto relative">
            <img 
              src={selectedImage} 
              alt="Selected plant leaf" 
              className="w-full h-auto rounded-lg border-2 border-green-500/50"
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-end space-x-4 max-w-4xl mx-auto">
          {/* Image Upload Buttons */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-14 h-14 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-emerald-400 rounded-2xl flex items-center justify-center border border-white/10 transition-all duration-500 hover:scale-110"
              title="Upload image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-14 h-14 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-emerald-400 rounded-2xl flex items-center justify-center border border-white/10 transition-all duration-500 hover:scale-110"
              title="Take photo"
            >
              <Camera className="w-6 h-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={disabled}
            />
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Plantiva is thinking..." : "Describe your plant's symptoms... I'm here to help! 🌿"}
              disabled={disabled}
              rows={1}
              className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none min-h-[56px] max-h-36 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner backdrop-blur-md hover:bg-white/10 focus:bg-white/10"
            />
            {message.trim() && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded">
                Shift + Enter for new line
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={(!message.trim() && !selectedImage) || disabled}
            className="w-14 h-14 bg-gradient-to-br from-green-600 via-emerald-600 to-lime-500 hover:from-green-500 hover:via-emerald-500 hover:to-lime-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:shadow-green-500/25 hover:scale-110 disabled:hover:scale-100 disabled:hover:shadow-none relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            {disabled ? (
              <Loader2 className="w-6 h-6 animate-spin relative z-10" />
            ) : (
              <div className="relative z-10 flex items-center justify-center">
                <Send className="w-6 h-6" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;