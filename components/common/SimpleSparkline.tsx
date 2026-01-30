'use client';

import { useState } from 'react';

type SimpleSparklineProps = {
  data: number[];
  color: string;
  height?: number;
  hasData: boolean;
  dates?: string[]; // Optional dates for tooltip
  formatValue?: (value: number) => string; // Optional formatter
};

export const SimpleSparkline = ({
  data,
  color,
  height = 20,
  hasData,
  dates,
  formatValue = (v) => v.toFixed(2),
}: SimpleSparklineProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Placeholder if no data yet
  if (!hasData || data.length < 2) {
    return (
      <div 
        className="flex items-center justify-center text-[9px] text-text-faint italic"
        style={{ height: `${height}px` }}
      >
        📊 Collecting data...
      </div>
    );
  }

  // Calculate dimensions
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1; // Avoid division by zero

  // Generate SVG path points
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (((value - minValue) / range) * height * 0.8);
    return `${x},${y}`;
  }).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = (x / rect.width) * 100;
    
    // Find closest data point
    const index = Math.round((relativeX / 100) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    
    setHoveredIndex(clampedIndex);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full cursor-crosshair"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trend line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        
        {/* Data points */}
        {data.map((value, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = height - (((value - minValue) / range) * height * 0.8);
          const isHovered = hoveredIndex === i;
          
          return (
            <circle 
              key={i} 
              cx={x} 
              cy={y} 
              r={isHovered ? "2" : "1"} 
              fill={color} 
              opacity={isHovered ? "1" : "0.6"}
              style={{ transition: 'all 0.15s ease' }}
            />
          );
        })}
        
        {/* Hover vertical line */}
        {hoveredIndex !== null && (
          <line
            x1={(hoveredIndex / (data.length - 1)) * 100}
            y1="0"
            x2={(hoveredIndex / (data.length - 1)) * 100}
            y2={height}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.3"
            strokeDasharray="2,2"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${mousePosition.x + 12}px`,
            top: `${mousePosition.y - 10}px`,
          }}
        >
          <div
            className="px-2 py-1 rounded shadow-lg text-[10px] font-medium whitespace-nowrap backdrop-blur-sm border"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              borderColor: `${color}40`,
              color: '#fff',
            }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span style={{ color }}>
                {formatValue(data[hoveredIndex])}
              </span>
            </div>
            {dates && dates[hoveredIndex] && (
              <div className="text-[9px] opacity-70 mt-0.5">
                {new Date(dates[hoveredIndex]).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
