'use client';

import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface STOINCCalculatorButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function STOINCCalculatorButton({ onClick, isOpen }: STOINCCalculatorButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

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
          fixed bottom-24 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-r from-green-500 to-cyan-500
          shadow-lg hover:shadow-2xl
          transform hover:scale-110 active:scale-95
          transition-all duration-200
          flex items-center justify-center
          group
        "
        aria-label="Open STOINC Calculator"
      >
        <Calculator 
          className={`
            w-7 h-7 text-white
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
        <div className="
          fixed bottom-24 right-24 z-50
          px-3 py-2 rounded-lg
          bg-gray-900 text-white text-sm
          whitespace-nowrap
          shadow-lg
          animate-in fade-in slide-in-from-right-2
          duration-200
        ">
          STOINC Calculator
        </div>
      )}
    </>
  );
}
