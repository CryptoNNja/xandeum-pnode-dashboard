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
  const animationFrameRef = useRef<number>();

  const isDark = theme === "dark";
  
  // Couleurs adaptées au mode
  // Couleurs CYAN/TEAL explicites
  const nodeColor = isDark 
    ? "#14F195"  // Cyan Xandeum en dark
    : "#0D9488";  // Teal foncé en light

  const lineColor = isDark
    ? "#14F195"  // Cyan pour lignes
    : "#0D9488";

  const glowColor = isDark
    ? "#14F195"  // Cyan pour glow
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

    // Initialiser 8 nodes avec positions aléatoires
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

      // Mettre à jour positions (mouvement doux)
      nodes.forEach((node) => {
        // Smooth interpolation vers target
        node.vx += (node.targetX - node.x) * 0.002;
        node.vy += (node.targetY - node.y) * 0.002;
        
        // Friction
        node.vx *= 0.95;
        node.vy *= 0.95;
        
        node.x += node.vx;
        node.y += node.vy;

        // Nouvelle target aléatoire si proche
        const dist = Math.hypot(node.targetX - node.x, node.targetY - node.y);
        if (dist < 20) {
          node.targetX = Math.random() * w;
          node.targetY = Math.random() * h;
        }

        // Rebond sur les bords
        if (node.x < 50) node.targetX = w - 100;
        if (node.x > w - 50) node.targetX = 100;
        if (node.y < 30) node.targetY = h - 60;
        if (node.y > h - 30) node.targetY = 60;
      });

      // Dessiner les connexions (lignes)
      nodes.forEach((nodeA, i) => {
        nodes.slice(i + 1).forEach((nodeB) => {
          const dist = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
          // Connecter si distance < 250px
          if (dist < 250) {
            const opacity = 1 - dist / 250; // Fade selon distance
            ctx.strokeStyle = isDark
              ? `rgba(20, 241, 149, ${opacity * 0.15})` // Cyan avec opacity
              : `rgba(13, 148, 136, ${opacity * 0.12})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        });
      });

      // Dessiner les nodes (points)
      nodes.forEach((node) => {
        // Glow
        ctx.shadowBlur = isDark ? 12 : 8;
        ctx.shadowColor = isDark
          ? "rgba(20, 241, 149, 0.6)" // Cyan glow
          : "rgba(13, 148, 136, 0.4)";

        // Point
        ctx.fillStyle = isDark
          ? "rgba(20, 241, 149, 0.8)" // Cyan opaque
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
