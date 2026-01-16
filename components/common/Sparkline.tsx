'use client';

type SparklineProps = {
  data: Array<{ mainnet: number; devnet: number }>;
  mainnetColor: string;
  devnetColor: string;
  height?: number;
  hasData: boolean;
  isLight: boolean;
};

export const Sparkline = ({
  data,
  mainnetColor,
  devnetColor,
  height = 40,
  hasData,
  isLight,
}: SparklineProps) => {
  // Placeholder if no data yet
  if (!hasData || data.length < 2) {
    return (
      <div 
        className="flex items-center justify-center text-xs text-text-faint italic"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="text-xs opacity-60">📊 Collecting data...</div>
          <div className="text-xs opacity-40 mt-0.5">Check back in a few days</div>
        </div>
      </div>
    );
  }

  // Calculate dimensions
  const width = 100; // percentage
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.mainnet, d.devnet))
  );

  // Generate SVG path for mainnet line
  const mainnetPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((d.mainnet / maxValue) * height * 0.8);
    return `${x},${y}`;
  }).join(' ');

  // Generate SVG path for devnet line
  const devnetPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((d.devnet / maxValue) * height * 0.8);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="w-full"
      style={{ height: `${height}px` }}
    >
      {/* Mainnet line */}
      <polyline
        points={mainnetPoints}
        fill="none"
        stroke={mainnetColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      
      {/* Devnet line */}
      <polyline
        points={devnetPoints}
        fill="none"
        stroke={devnetColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      
      {/* Optional: Add dots at each point */}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const yMainnet = height - ((d.mainnet / maxValue) * height * 0.8);
        const yDevnet = height - ((d.devnet / maxValue) * height * 0.8);
        
        return (
          <g key={i}>
            <circle cx={x} cy={yMainnet} r="1.5" fill={mainnetColor} opacity="0.6" />
            <circle cx={x} cy={yDevnet} r="1.5" fill={devnetColor} opacity="0.6" />
          </g>
        );
      })}
    </svg>
  );
};
