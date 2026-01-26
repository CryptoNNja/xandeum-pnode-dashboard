'use client';

import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { useFloatingButtonPosition } from '@/hooks/useFloatingButtonPosition';

interface STOINCCalculatorButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function STOINCCalculatorButton({ onClick, isOpen }: STOINCCalculatorButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const bottomOffset = useFloatingButtonPosition(84); // 84px base position

  // Fix: Reset hover state when modal closes
  useEffect(() => {
    if (isOpen) {
      setIsHovered(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating Button - Above Chatbot */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="
          fixed right-6 z-50
          w-12 h-12 rounded-full
          bg-gradient-to-r from-green-500 to-cyan-500
          shadow-lg hover:shadow-2xl
          transform hover:scale-110 active:scale-95
          transition-all duration-200
          flex items-center justify-center
          group
        "
        style={{ bottom: `${bottomOffset}px` }}
        aria-label="Open STOINC Calculator"
      >
        <Calculator 
          className={`
            w-6 h-6 text-white
            transition-transform duration-300
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
        
        {/* Pulse animation when not open */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
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
          STOINC Calculator
        </div>
      )}
    </>
  );
}
