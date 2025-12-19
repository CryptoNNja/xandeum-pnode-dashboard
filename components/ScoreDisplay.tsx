'use client';

import { calculateNodeScore, getScoreColor, getScoreLabel } from '@/lib/scoring';
import type { PNode } from '@/lib/types';

interface ScoreDisplayProps {
  pnode: PNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreDisplay({ pnode, size = 'md' }: ScoreDisplayProps) {
  const score = calculateNodeScore(pnode);
  const label = getScoreLabel(score);
  const color = getScoreColor(score);

  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      text: 'text-xs',
      label: 'text-[10px]',
    },
    md: {
      container: 'w-16 h-16',
      text: 'text-sm',
      label: 'text-xs',
    },
    lg: {
      container: 'w-24 h-24',
      text: 'text-2xl',
      label: 'text-sm',
    },
  };

  const sizes = sizeClasses[size];
  const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Accentuer l'effet visuel si score critique
  const isCritical = score < 40;
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Label */}
      <span className={`${sizes.label} font-semibold text-gray-300 text-center leading-tight`}>
        {label}
      </span>

      {/* Score circle */}
      <div className={`relative ${sizes.container} flex items-center justify-center`}>
        <svg
          className="absolute transform -rotate-90"
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - 4}
            fill="none"
            stroke="#1F2937"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - 4}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Effet pulse si critique */}
        {isCritical && (
          <span className="absolute inset-0 rounded-full bg-red-500/30 blur-lg animate-pulse z-0" />
        )}

        {/* Score text */}
        <div className="flex flex-col items-center z-10">
          <span className={`${sizes.text} font-bold ${color}`}>{score}</span>
          <span className="text-[8px] text-gray-400">/100</span>
        </div>
      </div>
    </div>
  );
}
