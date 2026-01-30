'use client';

type SimpleSparklineProps = {
  data: number[];
  color: string;
  height?: number;
  hasData: boolean;
};

export const SimpleSparkline = ({
  data,
  color,
  height = 20,
  hasData,
}: SimpleSparklineProps) => {
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

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="w-full"
      style={{ height: `${height}px` }}
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
      
      {/* Optional: Add dots at each point */}
      {data.map((value, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = height - (((value - minValue) / range) * height * 0.8);
        
        return (
          <circle 
            key={i} 
            cx={x} 
            cy={y} 
            r="1" 
            fill={color} 
            opacity="0.6" 
          />
        );
      })}
    </svg>
  );
};
