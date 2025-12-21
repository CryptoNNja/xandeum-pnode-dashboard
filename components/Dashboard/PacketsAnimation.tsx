"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PacketsAnimationProps {
  throughput: number; // In MB/s
  maxThroughput?: number; // For speed calculation
}

export const PacketsAnimation = ({ throughput, maxThroughput = 10 }: PacketsAnimationProps) => {
  const [packets, setPackets] = useState<number[]>([]);

  // Generate packet IDs
  useEffect(() => {
    setPackets([1, 2, 3, 4, 5]);
  }, []);

  // Calculate animation speed based on throughput (higher = faster)
  const getAnimationDuration = () => {
    const normalized = Math.min(throughput / maxThroughput, 1);
    // Duration between 4s (slow) and 1.5s (fast)
    return 4 - (normalized * 2.5);
  };

  const duration = getAnimationDuration();

  return (
    <div className="relative w-full h-8 overflow-hidden">
      {/* Background line */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-full h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(123, 63, 242, 0.2) 50%, transparent 100%)',
        }}
      />

      {/* Animated packets */}
      {packets.map((id, index) => (
        <motion.div
          key={id}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-sm"
          style={{
            background: 'linear-gradient(135deg, #7B3FF2 0%, #14F195 100%)',
            boxShadow: '0 0 8px rgba(123, 63, 242, 0.6)',
            left: '-5%',
          }}
          animate={{ 
            left: '105%',
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            ease: "linear",
            delay: index * (duration / packets.length), // Stagger packets
            repeatDelay: 0,
          }}
        />
      ))}

      {/* Glow effect on edges */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, var(--bg-app), transparent)',
        }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, var(--bg-app), transparent)',
        }}
      />
    </div>
  );
};
