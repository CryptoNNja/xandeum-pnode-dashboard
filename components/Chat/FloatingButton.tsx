'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { useFloatingButtonPosition } from '@/hooks/useFloatingButtonPosition';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingButton({ onClick, isOpen }: FloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const bottomOffset = useFloatingButtonPosition(24); // 24px = bottom-6

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="
          fixed right-6 z-50
          w-12 h-12 rounded-full
          bg-gradient-to-r from-purple-600 to-blue-600
          shadow-lg hover:shadow-2xl
          transform hover:scale-110 active:scale-95
          transition-all duration-200
          flex items-center justify-center
          group
        "
        style={{ bottom: `${bottomOffset}px` }}
        aria-label="Open Ronin AI"
      >
        <Bot 
          className={`
            w-6 h-6 text-white
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
        <div 
          className="
            fixed right-20 z-50
            px-3 py-2 rounded-lg
            bg-gray-900 text-white text-sm
            whitespace-nowrap
            shadow-lg
            animate-in fade-in slide-in-from-right-2
            duration-200
          "
          style={{ bottom: `${bottomOffset}px` }}
        >
          Ronin AI <kbd className="ml-2 px-1.5 py-0.5 bg-gray-800 rounded text-xs">Ctrl+K</kbd>
        </div>
      )}
    </>
  );
}
