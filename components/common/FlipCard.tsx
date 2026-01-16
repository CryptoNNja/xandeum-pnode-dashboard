'use client';

import { useState } from 'react';
import { LucideIcon } from 'lucide-react';

type FlipCardProps = {
  // Front face
  icon: LucideIcon;
  iconColor: string;
  title: string;
  mainValue: string | number;
  subtitle: string;
  isLight: boolean;
  hexToRgba: (hex: string, alpha: number) => string;
  
  // Back face
  backContent: React.ReactNode;
  
  // Optional
  onClick?: () => void;
  disableFlip?: boolean;
};

export const FlipCard = ({
  icon: Icon,
  iconColor,
  title,
  mainValue,
  subtitle,
  isLight,
  hexToRgba,
  backContent,
  onClick,
  disableFlip = false,
}: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    if (disableFlip && onClick) {
      onClick();
      return;
    }
    if (!disableFlip) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div 
      className="flip-card-container"
      style={{ 
        perspective: '1000px',
        minHeight: '180px'
      }}
    >
      <div
        className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: disableFlip ? 'pointer' : 'pointer',
        }}
      >
        {/* FRONT FACE */}
        <div
          className="flip-card-face kpi-card"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            padding: '1.5rem',
          }}
        >
          <div className="flex items-start justify-between gap-4 h-full">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft mb-1">
                  {title}
                </p>
                <p className="text-sm text-text-faint">{subtitle}</p>
              </div>
              
              <div className="mt-4">
                <div className="text-4xl font-bold tracking-tight" style={{ color: iconColor }}>
                  {mainValue}
                </div>
              </div>
            </div>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: hexToRgba(iconColor, 0.12) }}
            >
              <Icon 
                className="w-5 h-5" 
                strokeWidth={2.3} 
                style={{ color: iconColor }} 
              />
            </div>
          </div>
          
          {!disableFlip && (
            <div className="absolute bottom-2 right-2 text-xs text-text-faint opacity-50">
              Click to flip
            </div>
          )}
        </div>

        {/* BACK FACE */}
        <div
          className="flip-card-face kpi-card"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            padding: '1.5rem',
          }}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                {title} Details
              </p>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(iconColor, 0.12) }}
              >
                <Icon 
                  className="w-4 h-4" 
                  strokeWidth={2.5} 
                  style={{ color: iconColor }} 
                />
              </div>
            </div>
            
            <div className="flex-1">
              {backContent}
            </div>
            
            <div className="text-xs text-text-faint opacity-50 text-center mt-2">
              Click to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
