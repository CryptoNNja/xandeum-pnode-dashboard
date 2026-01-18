"use client";


import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useHeroPreset } from "@/hooks/useHeroPreset";
import { useTheme } from "@/hooks/useTheme";
import { useHydrated } from "@/hooks/useHydrated";


interface EnhancedHeroProps {
  criticalCount: number;
  warningCount: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const isShort = sanitized.length === 3;
  const full = isShort
    ? sanitized
      .split("")
      .map((char) => char + char)
      .join("")
    : sanitized.padEnd(6, "0");
  const r = parseInt(full.substring(0, 2), 16) || 0;
  const g = parseInt(full.substring(2, 4), 16) || 0;
  const b = parseInt(full.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EnhancedHero: React.FC<EnhancedHeroProps> = ({
  criticalCount,
  warningCount,
}) => {
  const { currentPreset, preset } = useHeroPreset();
  const { theme } = useTheme();
  const hasHydrated = useHydrated();

  const effectiveTheme = hasHydrated ? theme : "dark";
  const isLight = effectiveTheme === "light";
  const logoSrc = isLight ? "/logo_ronin_light.png" : "/logo_ronin_dark.png";
  const gradientOpacity = isLight ? 0.04 : 0.09;
  const gridOpacity = isLight ? 0.025 : 0.012;

  const heroLightGradient = `linear-gradient(135deg, ${hexToRgba(
    currentPreset.colors.primary,
    gradientOpacity * 1.5
  )} 0%, ${hexToRgba(currentPreset.colors.secondary, gradientOpacity * 1.5)} 45%, ${hexToRgba(
    currentPreset.colors.accent2,
    gradientOpacity * 1.8
  )} 100%)`;

  const heroBackground = isLight
    ? heroLightGradient
    : "var(--bg-app)";

  const gridLineHorizontal = hexToRgba(
    currentPreset.colors.secondary,
    isLight ? 0.04 : 0.13
  );
  const gridLineVertical = hexToRgba(
    currentPreset.colors.accent1,
    isLight ? 0.04 : 0.13
  );

  const radialOverlay = isLight
    ? `radial-gradient(circle at 50% 50%, transparent 0%, ${hexToRgba(
      currentPreset.colors.secondary,
      0.13
    )} 60%, ${hexToRgba(currentPreset.colors.primary, 0.18)} 100%)`
    : `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.22) 100%)`;

  return (
    <header
      className="relative border-b border-[#2D3454] overflow-hidden"
      style={{ background: heroBackground }}
    >
      {/* Gradient Layers */}
      {currentPreset.gradients.map((gradient, idx) => {
        const speeds = ["animate-gradient-slow", "animate-gradient-medium", "animate-gradient-fast"];
        return (
          <div
            key={`${preset}-gradient-${idx}`}
            className={`absolute inset-0 ${speeds[idx] || "animate-gradient-slow"}`}
            style={{
              backgroundImage: gradient,
              backgroundSize: idx === 0 ? "200% 200%" : idx === 1 ? "300% 300%" : "400% 400%",
              opacity: gradientOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}



      {/* Grid Pattern */}
      <div
        className="absolute inset-0 animate-pulse-slow"
        style={{
          opacity: gridOpacity,
          backgroundImage: `linear-gradient(to right, ${gridLineHorizontal} 1px, transparent 1px),linear-gradient(to bottom, ${gridLineVertical} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          zIndex: 6,
          pointerEvents: "none",
        }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: radialOverlay,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center" style={{ height: '140px' }}>
          <div className="flex items-center justify-between gap-8 w-full">
            <Link href="/" className="flex items-center group hover:opacity-90 transition-opacity">
              <Image
                src={logoSrc}
                alt="Ronin pNode Analytics"
                className="object-contain"
                width={800}
                height={145}
                style={{ width: 'auto', height: 145 }}
                priority
              />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {criticalCount > 0 && (
                  <motion.div
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    title={`${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''} - Immediate attention required`}
                  >
                    {/* Glow pulsant RENFORCÉ pour Critical */}
                    <motion.div
                      className="absolute -inset-1 rounded-full bg-red-500 blur-lg"
                      animate={{ 
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 relative z-10" />
                    <span className="text-sm font-bold text-red-500 relative z-10">{criticalCount}</span>
                  </motion.div>
                )}
                
                {warningCount > 0 && (
                  <motion.div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    title={`${warningCount} Warning${warningCount > 1 ? 's' : ''} - Monitor closely`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-sm font-bold text-orange-500">{warningCount}</span>
                  </motion.div>
                )}
                
                {criticalCount === 0 && warningCount === 0 && (
                  <motion.div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-500/15 border border-green-500/30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    title="All systems operating normally"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-sm font-bold text-green-500">OK</span>
                  </motion.div>
                )}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className={`absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t pointer-events-none`} style={{ background: `linear-gradient(to top, ${isLight ? '#f5f5f7' : '#0A0E27'} 0%, transparent 100%)` }} />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient-slow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gradient-medium {
          0%, 100% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        @keyframes gradient-fast {
          0%, 100% { background-position: 100% 50%; }
          50% { background-position: 0% 50%; }
        }
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }
        .animate-gradient-slow { animation: gradient-slow 15s ease infinite; }
        .animate-gradient-medium { animation: gradient-medium 10s ease infinite; }
        .animate-gradient-fast { animation: gradient-fast 7s ease infinite; }
        .animate-gradient-text { animation: gradient-text 8s ease infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
    </header>
  );
};

export default EnhancedHero;