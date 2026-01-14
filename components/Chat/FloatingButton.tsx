'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingButton({ onClick, isOpen }: FloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-r from-purple-600 to-blue-600
          shadow-lg hover:shadow-2xl
          transform hover:scale-110 active:scale-95
          transition-all duration-200
          flex items-center justify-center
          group
        "
        aria-label="Open Ronin AI"
      >
        <Bot 
          className={`
            w-7 h-7 text-white
            transition-transform duration-300
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
        
        {/* Pulse animation when not open */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20" />
        )}
      </button>

      {/* Tooltip */}
      {isHovered && !isOpen && (
        <div className="
          fixed bottom-6 right-24 z-50
          px-3 py-2 rounded-lg
          bg-gray-900 text-white text-sm
          whitespace-nowrap
          shadow-lg
          animate-in fade-in slide-in-from-right-2
          duration-200
        ">
          Ronin AI <kbd className="ml-2 px-1.5 py-0.5 bg-gray-800 rounded text-xs">Ctrl+K</kbd>
        </div>
      )}
    </>
  );
}
