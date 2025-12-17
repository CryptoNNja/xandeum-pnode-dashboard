"use client";


import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useHeroPreset } from "@/hooks/useHeroPreset";
import { useTheme } from "@/hooks/useTheme";
import { useHydrated } from "@/hooks/useHydrated";


interface EnhancedHeroProps {
  criticalCount: number;
  onAlertsClick: () => void;
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
  onAlertsClick,
}) => {
  const { currentPreset, preset } = useHeroPreset();
  const { theme } = useTheme();
  const hasHydrated = useHydrated();

  const effectiveTheme = hasHydrated ? theme : "dark";
  const isLight = effectiveTheme === "light";
  const logoSrc = isLight ? "/xandeum_light.png" : "/xandeum_dark.png";
  const gradientOpacity = isLight ? 0.04 : 0.09;
  const titleColorClass = isLight ? "text-gray-900" : "text-white";
  const titleGlowStyle = useMemo(
    () => ({
      filter: isLight
        ? "drop-shadow(0 0 6px rgba(20, 241, 149, 0.10))"
        : "drop-shadow(0 0 14px rgba(20, 241, 149, 0.18))",
      textShadow: isLight
        ? "0 2px 6px rgba(15,23,42,0.13)"
        : "0 4px 14px rgba(0,0,0,0.38)",
      WebkitTextStroke: isLight
        ? "0.2px rgba(15,23,42,0.13)"
        : "0.3px rgba(255,255,255,0.18)",
    }),
    [isLight]
  );
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-6 group hover:opacity-90 transition-opacity">
              <Image
                src={logoSrc}
                alt="Xandeum Logo"
                className="object-contain"
                width={256}
                height={64}
                style={{ width: 256, height: 64 }}
                priority
              />
              <div>
                <h1
                  className={`text-3xl font-bold ${titleColorClass}`}
                  style={titleGlowStyle}
                >
                  P-Node Analytics
                </h1>
                <p className="text-sm text-gray-400 mt-1">Real-time Network Monitoring</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={onAlertsClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative overflow-hidden"
                style={{
                  backgroundColor:
                    criticalCount > 0
                      ? hexToRgba("#EF4444", 0.15)
                      : hexToRgba("#10B981", 0.15),
                  border: `1px solid ${criticalCount > 0 ? hexToRgba("#EF4444", 0.3) : hexToRgba("#10B981", 0.3)
                    }`,
                }}
                whileHover={{
                  scale: 1.02,
                  backgroundColor:
                    criticalCount > 0
                      ? hexToRgba("#EF4444", 0.25)
                      : hexToRgba("#10B981", 0.25),
                }}
                whileTap={{ scale: 0.98 }}
              >
                {criticalCount > 0 && (
                  <motion.div
                    className="absolute -inset-2 bg-red-500 blur-[32px] rounded-xl ring-8 ring-red-400/80 shadow-2xl"
                    style={{ opacity: 0.55, zIndex: 1, boxShadow: '0 0 32px 12px #ef4444cc' }}
                    animate={{ opacity: [0.25, 0.85, 0.25], scale: [1, 1.18, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <AlertCircle
                  className="w-5 h-5"
                  style={{
                    color: criticalCount > 0 ? "#EF4444" : "#10B981",
                  }}
                />
                <span
                  className="text-base font-medium"
                  style={{
                    color: criticalCount > 0 ? "#EF4444" : "#10B981",
                  }}
                >
                  {criticalCount > 0
                    ? `${criticalCount} CRITICAL`
                    : "All Systems Normal"}
                </span>
              </motion.button>
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