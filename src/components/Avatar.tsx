import React from 'react';
import { User, Bot } from 'lucide-react';

interface AvatarProps {
  type: 'user' | 'bot';
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ type, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  const gradient =
    type === 'user'
      ? 'from-emerald-400 via-green-500 to-lime-400'
      : 'from-green-300 via-emerald-600 to-teal-400';

  return (
    <div className={`${sizeClasses[size]} relative group`}>
      
      {/* 🧬 Organic morph layer */}
      <div className="absolute inset-0 animate-morph">
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} opacity-80 blur-xl`}
          style={{
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%'
          }}
        />
      </div>

      {/* 🌿 Secondary soft layer */}
      <div className="absolute inset-0 animate-morph2">
        <div
          className="w-full h-full bg-green-400/40 blur-2xl"
          style={{
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%'
          }}
        />
      </div>

      {/* 🌱 Core (clean + glassy) */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-[70%] h-[70%] rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
          
          <div className="text-white">
            {type === 'user' ? (
              <User className={iconSizes[size]} />
            ) : (
              <Bot className={iconSizes[size]} />
            )}
          </div>

        </div>
      </div>

      {/* ✨ Hover life effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-green-400/20 blur-2xl rounded-full" />

    </div>
  );
};

export default Avatar;