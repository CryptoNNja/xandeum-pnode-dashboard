"use client";

import { useEffect, useRef, useState } from "react";

type MemoryFlowAnimationProps = {
  ramUsagePercent: number;
  isLight: boolean;
};

type Bubble = {
  id: number;
  barIndex: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
};

export const MemoryFlowAnimation = ({ ramUsagePercent, isLight }: MemoryFlowAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate animation parameters based on RAM usage
  const getAnimationIntensity = () => {
    if (ramUsagePercent === 0) return 0;
    if (ramUsagePercent < 40) return 0.3;
    if (ramUsagePercent < 70) return 0.6;
    if (ramUsagePercent < 85) return 0.8;
    return 1;
  };

  // Get color based on RAM usage
  const getStatusColor = () => {
    if (ramUsagePercent < 60) return { h: 210, s: 80, l: isLight ? 55 : 65 }; // Blue
    if (ramUsagePercent < 80) return { h: 45, s: 85, l: isLight ? 50 : 60 }; // Orange
    return { h: 0, s: 75, l: isLight ? 50 : 60 }; // Red
  };

  const intensity = getAnimationIntensity();
  const bubbleCount = Math.floor(6 + (intensity * 12)); // 6-18 bubbles
  const color = getStatusColor();

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parent = canvasRef.current.parentElement;
        setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const barCount = 4;
    const barWidth = (dimensions.width / barCount) * 0.6;
    const barSpacing = dimensions.width / barCount;

    // Initialize bubbles
    const initBubbles = () => {
      bubblesRef.current = [];
      for (let i = 0; i < bubbleCount; i++) {
        bubblesRef.current.push(createBubble(i));
      }
    };

    const createBubble = (id: number): Bubble => {
      const barIndex = Math.floor(Math.random() * barCount);
      return {
        id,
        barIndex,
        y: dimensions.height + 10,
        size: 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.5,
        speed: 0.5 + (intensity * 1.5) + Math.random() * 0.5,
      };
    };

    const updateBubble = (bubble: Bubble) => {
      bubble.y -= bubble.speed;

      // Reset bubble if it goes off screen
      if (bubble.y < -10) {
        const newBubble = createBubble(bubble.id);
        bubble.barIndex = newBubble.barIndex;
        bubble.y = newBubble.y;
        bubble.size = newBubble.size;
        bubble.opacity = newBubble.opacity;
        bubble.speed = newBubble.speed;
      }
    };

    const drawBubble = (bubble: Bubble) => {
      const x = barSpacing * bubble.barIndex + barSpacing / 2;
      const maxHeight = dimensions.height * (ramUsagePercent / 100);

      // Only draw bubbles within the filled portion
      if (bubble.y > dimensions.height - maxHeight) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(x, bubble.y, 0, x, bubble.y, bubble.size * 2);
        gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l + 15}%, ${bubble.opacity})`);
        gradient.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l}%, ${bubble.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l - 10}%, 0)`);

        ctx.fillStyle = gradient;
        ctx.arc(x, bubble.y, bubble.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawBars = (time: number) => {
      const pulseScale = 1 + Math.sin(time * 0.002) * 0.03; // Subtle pulse

      for (let i = 0; i < barCount; i++) {
        const x = barSpacing * i + (barSpacing - barWidth) / 2;
        const fillHeight = (dimensions.height * (ramUsagePercent / 100)) * pulseScale;
        const y = dimensions.height - fillHeight;

        // Background bar (empty)
        ctx.fillStyle = isLight
          ? "rgba(59, 130, 246, 0.08)"
          : "rgba(59, 130, 246, 0.12)";
        ctx.fillRect(x, 0, barWidth, dimensions.height);

        // Filled portion with gradient
        const gradient = ctx.createLinearGradient(x, dimensions.height, x, y);
        gradient.addColorStop(0, `hsla(${color.h}, ${color.s}%, ${color.l}%, 0.4)`);
        gradient.addColorStop(0.5, `hsla(${color.h}, ${color.s}%, ${color.l + 5}%, 0.6)`);
        gradient.addColorStop(1, `hsla(${color.h}, ${color.s}%, ${color.l + 10}%, 0.8)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, fillHeight);

        // Top highlight
        ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l + 20}%, 0.6)`;
        ctx.fillRect(x, y, barWidth, 2);

        // Bar border
        ctx.strokeStyle = isLight
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 0, barWidth, dimensions.height);
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw bars first
      drawBars(time);

      // Draw bubbles on top
      if (ramUsagePercent > 0) {
        bubblesRef.current.forEach((bubble) => {
          updateBubble(bubble);
          drawBubble(bubble);
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    initBubbles();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, ramUsagePercent, bubbleCount, intensity, color, isLight]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0"
      style={{
        opacity: ramUsagePercent === 0 ? 0.3 : 0.9,
        transition: "opacity 1s ease-in-out",
      }}
    />
  );
};
