"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface MeshNetworkProps {
  theme: "dark" | "light";
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

export default function MeshNetwork({ theme }: MeshNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const isDark = theme === "dark";
  
  // Colors adapted to theme mode
  // Explicit CYAN/TEAL colors
  const nodeColor = isDark 
    ? "#14F195"  // Cyan Xandeum in dark mode
    : "#0D9488";  // Dark teal in light mode

  const lineColor = isDark
    ? "#14F195"  // Cyan for lines
    : "#0D9488";

  const glowColor = isDark
    ? "#14F195"  // Cyan for glow
    : "#0D9488";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsive canvas
    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Initialize 8 nodes with random positions
    const initNodes = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      
      nodesRef.current = Array.from({ length: 8 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        targetX: Math.random() * w,
        targetY: Math.random() * h,
      }));
    };
    initNodes();

    // Animation loop
    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;

      // Update positions (smooth movement)
      nodes.forEach((node) => {
        // Smooth interpolation vers target
        node.vx += (node.targetX - node.x) * 0.002;
        node.vy += (node.targetY - node.y) * 0.002;
        
        // Friction
        node.vx *= 0.95;
        node.vy *= 0.95;
        
        node.x += node.vx;
        node.y += node.vy;

        // New random target if close
        const dist = Math.hypot(node.targetX - node.x, node.targetY - node.y);
        if (dist < 20) {
          node.targetX = Math.random() * w;
          node.targetY = Math.random() * h;
        }

        // Bounce on edges
        if (node.x < 50) node.targetX = w - 100;
        if (node.x > w - 50) node.targetX = 100;
        if (node.y < 30) node.targetY = h - 60;
        if (node.y > h - 30) node.targetY = 60;
      });

      // Draw connections (lines)
      nodes.forEach((nodeA, i) => {
        nodes.slice(i + 1).forEach((nodeB) => {
          const dist = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
          // Connect if distance < 250px
          if (dist < 250) {
            const opacity = 1 - dist / 250; // Fade based on distance
            ctx.strokeStyle = isDark
              ? `rgba(20, 241, 149, ${opacity * 0.15})` // Cyan with opacity
              : `rgba(13, 148, 136, ${opacity * 0.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes (points)
      nodes.forEach((node) => {
        // Glow
        ctx.shadowBlur = isDark ? 12 : 8;
        ctx.shadowColor = isDark
          ? "rgba(20, 241, 149, 0.6)" // Cyan glow
          : "rgba(13, 148, 136, 0.4)";

        // Point
        ctx.fillStyle = isDark
          ? "rgba(20, 241, 149, 0.8)" // Opaque cyan
          : "rgba(13, 148, 136, 0.6)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, isDark ? 3 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [theme, isDark, nodeColor, lineColor, glowColor]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 3 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    />
  );
}
