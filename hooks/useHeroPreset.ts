"use client";

import { useMemo } from "react";

export type PresetName = "COSMIC_WAVES" | "AURORA_HOLOGRAM" | "NEON_DREAM";

export interface PresetColors {
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
}

export interface HeroPreset {
  name: string;
  emoji: string;
  colors: PresetColors;
  gradients: string[];
  orbColors: string[];
  particleColor: string;
  orbShape?: "circle" | "star" | "diamond";
  animationSpeed?: number;
  effect?: "glow" | "shadow" | "blur";
}

export const HERO_PRESETS: Record<PresetName, HeroPreset> = {
  COSMIC_WAVES: {
    name: "Cosmic Waves",
    emoji: "🌌",
    colors: {
      primary: "#9945FF",
      secondary: "#14F195",
      accent1: "#FFA500",
      accent2: "#FFD700",
    },
    gradients: [
      "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
      "linear-gradient(45deg, #FFA500 0%, #FFD700 100%)",
      "linear-gradient(225deg, #14F195 0%, #9945FF 100%)",
    ],
    orbColors: ["#9945FF", "#FFA500", "#14F195", "#FFD700"],
    particleColor: "#14F195",
    orbShape: "circle",
    animationSpeed: 1.0,
    effect: "glow",
  },

  AURORA_HOLOGRAM: {
    name: "Aurora Hologram",
    emoji: "✨",
    colors: {
      primary: "#7B3FF2",
      secondary: "#00D4AA",
      accent1: "#FFA500",
      accent2: "#FFD700",
    },
    gradients: [
      "linear-gradient(135deg, #7B3FF2 0%, #00D4AA 100%)",
      "linear-gradient(45deg, #FFA500 0%, #FFD700 100%)",
      "linear-gradient(225deg, #00D4AA 0%, #7B3FF2 100%)",
    ],
    orbColors: ["#7B3FF2", "#FFA500", "#00D4AA", "#FFD700"],
    particleColor: "#00D4AA",
    orbShape: "star",
    animationSpeed: 1.5,
    effect: "shadow",
  },

  NEON_DREAM: {
    name: "Neon Dream",
    emoji: "🎆",
    colors: {
      primary: "#FF0080",
      secondary: "#00D4AA",
      accent1: "#FFA500",
      accent2: "#FFD700",
    },
    gradients: [
      "radial-gradient(circle at 30% 50%, #FF0080 0%, #FFA500 50%, #00D4AA 100%)",
      "radial-gradient(circle at 70% 50%, #FFD700 0%, #00D4AA 50%, #FF0080 100%)",
    ],
    orbColors: ["#FF0080", "#FFA500", "#00D4AA", "#FFD700"],
    particleColor: "#FF0080",
    orbShape: "diamond",
    animationSpeed: 2.0,
    effect: "blur",
  },
};

const DEFAULT_PRESET: PresetName = "NEON_DREAM";

export function useHeroPreset() {
  const preset = useMemo(() => DEFAULT_PRESET, []);
  const currentPreset = useMemo(() => HERO_PRESETS[preset], [preset]);

  return {
    preset,
    currentPreset,
  };
}
