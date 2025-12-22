"use client";

import { useEffect, useRef, useState } from "react";

type ActiveStreamsAnimationProps = {
  activeStreams: number;
  isLight: boolean;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
  trail: Array<{ x: number; y: number; opacity: number }>;
};

export const ActiveStreamsAnimation = ({ activeStreams, isLight }: ActiveStreamsAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate animation parameters based on active streams
  const getAnimationIntensity = () => {
    if (activeStreams === 0) return 0;
    if (activeStreams < 10) return 0.3;
    if (activeStreams < 50) return 0.6;
    if (activeStreams < 100) return 0.8;
    return 1;
  };

  const intensity = getAnimationIntensity();
  const particleCount = Math.min(Math.max(Math.floor(activeStreams / 2), 5), 80);
  const baseSpeed = 0.5 + (intensity * 1.5);

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

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(i));
      }
    };

    const createParticle = (id: number): Particle => {
      return {
        id,
        x: -20,
        y: Math.random() * dimensions.height,
        vx: baseSpeed * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 0.3,
        size: 2 + Math.random() * 3,
        opacity: 0.4 + Math.random() * 0.6,
        hue: 200 + Math.random() * 20, // Blue range (200-220)
        trail: [],
      };
    };

    const updateParticle = (particle: Particle) => {
      // Update trail
      particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.opacity });
      if (particle.trail.length > 15) {
        particle.trail.shift();
      }

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Add subtle wave motion
      particle.x += Math.sin(particle.y * 0.02) * 0.2;
      particle.y += Math.sin(particle.x * 0.02) * 0.2;

      // Reset particle if it goes off screen (only check horizontal exit)
      if (particle.x > dimensions.width + 20) {
        const newParticle = createParticle(particle.id);
        particle.x = newParticle.x;
        particle.y = newParticle.y;
        particle.vx = newParticle.vx;
        particle.vy = newParticle.vy;
        particle.size = newParticle.size;
        particle.hue = newParticle.hue;
        particle.trail = [];
      }
      
      // Keep particles within vertical bounds
      if (particle.y < 0) particle.y = 0;
      if (particle.y > dimensions.height) particle.y = dimensions.height;
    };

    const drawParticle = (particle: Particle) => {
      // Draw trail with gradient fade
      for (let i = 0; i < particle.trail.length; i++) {
        const trailPoint = particle.trail[i];
        const trailOpacity = (i / particle.trail.length) * particle.opacity * 0.4;
        const trailSize = particle.size * (0.3 + (i / particle.trail.length) * 0.7);

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          trailPoint.x, trailPoint.y, 0,
          trailPoint.x, trailPoint.y, trailSize * 2
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 80%, ${isLight ? 60 : 70}%, ${trailOpacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, ${isLight ? 55 : 65}%, ${trailOpacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 60%, ${isLight ? 50 : 60}%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(trailPoint.x, trailPoint.y, trailSize * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw main particle with glow
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      gradient.addColorStop(0, `hsla(${particle.hue}, 90%, ${isLight ? 65 : 75}%, ${particle.opacity})`);
      gradient.addColorStop(0.4, `hsla(${particle.hue}, 80%, ${isLight ? 60 : 70}%, ${particle.opacity * 0.6})`);
      gradient.addColorStop(1, `hsla(${particle.hue}, 70%, ${isLight ? 55 : 65}%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw bright core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${particle.hue}, 100%, ${isLight ? 70 : 85}%, ${particle.opacity * 0.9})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawConnections = () => {
      const particles = particlesRef.current;
      const maxDistance = 100;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.15 * intensity;
            const avgHue = (particles[i].hue + particles[j].hue) / 2;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${avgHue}, 70%, ${isLight ? 60 : 70}%, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      if (activeStreams === 0 || intensity === 0) {
        // Fade out animation when no streams
        ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)";
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      } else {
        // Draw connections first (behind particles)
        drawConnections();

        // Update and draw all particles
        particlesRef.current.forEach((particle) => {
          updateParticle(particle);
          drawParticle(particle);
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, activeStreams, particleCount, baseSpeed, intensity, isLight]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: activeStreams === 0 ? 0.2 : 0.6 + (intensity * 0.4),
        transition: "opacity 1s ease-in-out",
      }}
    />
  );
};
