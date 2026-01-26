'use client';

import { useState } from 'react';
import { LucideIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { Sparkline } from './Sparkline';

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
  
  // Sparkline data (optional)
  sparklineData?: Array<{ mainnet: number; devnet: number }>;
  showSparkline?: boolean;
  
  // Delta badge (optional)
  delta?: number; // Change vs yesterday (e.g. +12, -5)
  deltaPercent?: number; // Percentage change (e.g. 4.2)
  
  // Extra content on front (optional, for custom widgets like decentralization bar)
  frontExtraContent?: React.ReactNode;
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
  sparklineData = [],
  showSparkline = false,
  delta,
  deltaPercent,
  frontExtraContent,
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
        height: '275px'
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
          <div className="h-full flex flex-col">
            {/* Header - Title + Icon on same line */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] font-semibold truncate" style={{ color: iconColor }}>
                  {title}
                </p>
                <p className="text-xs text-text-faint truncate">{subtitle}</p>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
                style={{ background: hexToRgba(iconColor, 0.15) }}
              >
                <Icon 
                  className="w-4 h-4" 
                  strokeWidth={2.5} 
                  style={{ color: iconColor }} 
                />
              </div>
            </div>
            
            {/* Main value - in elegant box with glow */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div 
                className="relative px-5 py-3 rounded-xl"
                style={{ 
                  background: isLight
                    ? `linear-gradient(135deg, ${hexToRgba(iconColor, 0.06)} 0%, ${hexToRgba(iconColor, 0.12)} 100%)`
                    : `linear-gradient(135deg, ${hexToRgba(iconColor, 0.12)} 0%, ${hexToRgba(iconColor, 0.18)} 100%)`,
                  border: `1.5px solid ${hexToRgba(iconColor, 0.2)}`,
                  boxShadow: `0 4px 16px ${hexToRgba(iconColor, 0.12)}`,
                }}
              >
                <div className="text-4xl font-bold tracking-tight" style={{ color: iconColor }}>
                  {mainValue}
                </div>
              </div>
            </div>
            
            {/* Sparkline or extra content at bottom */}
            <div className="mt-auto">
              {showSparkline && (
                <div>
                  {/* Delta badge - above sparkline box */}
                  {delta !== undefined && deltaPercent !== undefined && (
                    <div 
                      className="flex items-center justify-center gap-1.5 mb-1.5 text-xs"
                      style={{
                        color: delta >= 0 ? "#10B981" : "#EF4444",
                      }}
                    >
                      {delta >= 0 ? (
                        <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                      )}
                      <span className="font-semibold">{delta >= 0 ? "+" : ""}{delta}</span>
                      <span className="opacity-60 font-medium">{deltaPercent >= 0 ? "+" : ""}{deltaPercent.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {/* Sparkline box */}
                  <div 
                    className="p-3 rounded-lg border"
                    style={{ 
                      background: isLight ? "rgba(15,23,42,0.02)" : "rgba(255,255,255,0.02)",
                      borderColor: "var(--border-default)"
                    }}
                  >
                    <Sparkline
                      data={sparklineData}
                      mainnetColor="#10B981"
                      devnetColor="#F59E0B"
                      height={32}
                      hasData={sparklineData.length >= 2}
                      isLight={isLight}
                    />
                  </div>
                </div>
              )}
              
              {frontExtraContent && (
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    background: isLight ? "rgba(15,23,42,0.02)" : "rgba(255,255,255,0.02)",
                    borderColor: "var(--border-default)"
                  }}
                >
                  {frontExtraContent}
                </div>
              )}
            </div>
            
            {/* Call to action */}
            {!disableFlip && (
              <div className="text-center mt-3 text-xs text-text-faint opacity-50">
                Click to flip →
              </div>
            )}
          </div>
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
            padding: '1rem',
          }}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.30em] text-text-soft">
                {title} Details
              </p>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(iconColor, 0.12) }}
              >
                <Icon 
                  className="w-3.5 h-3.5" 
                  strokeWidth={2.5} 
                  style={{ color: iconColor }} 
                />
              </div>
            </div>
            
            <div className="flex-1">
              {backContent}
            </div>
            
            <div className="text-xs text-text-faint opacity-40 text-center mt-1.5">
              Click to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
