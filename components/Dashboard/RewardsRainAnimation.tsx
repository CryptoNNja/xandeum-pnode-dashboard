"use client";

import { useEffect, useRef, useState } from "react";

type RewardsRainAnimationProps = {
  participationRate: number;
  isActive: boolean;
  isLight: boolean;
};

type Coin = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  isGold: boolean;
  scale: number; // For 3D flip effect
};

export const RewardsRainAnimation = ({ 
  participationRate, 
  isActive,
  isLight 
}: RewardsRainAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coinsRef = useRef<Coin[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate animation parameters based on participation rate
  const getAnimationIntensity = () => {
    if (!isActive || participationRate === 0) return 0;
    if (participationRate >= 85) return 1;
    if (participationRate >= 70) return 0.7;
    return 0.4;
  };

  const intensity = getAnimationIntensity();
  const coinCount = Math.floor(10 + (intensity * 8)); // 10-18 coins for better performance

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

    // Initialize coins
    const initCoins = () => {
      coinsRef.current = [];
      for (let i = 0; i < coinCount; i++) {
        coinsRef.current.push(createCoin(i));
      }
    };

    const createCoin = (id: number): Coin => {
      const isGold = participationRate >= 70 ? Math.random() > 0.3 : Math.random() > 0.6;
      
      return {
        id,
        x: Math.random() * dimensions.width,
        y: -20 - Math.random() * dimensions.height * 1.5,
        size: 8 + Math.random() * 4, // Larger for visibility
        speed: 0.4 + (intensity * 0.3) + Math.random() * 0.2, // Much slower
        opacity: 0.7 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.01 + Math.random() * 0.015, // Very slow rotation
        isGold,
        scale: 1,
      };
    };

    const updateCoin = (coin: Coin) => {
      coin.y += coin.speed;
      coin.rotation += coin.rotationSpeed;
      
      // 3D flip effect (scale oscillates for depth)
      coin.scale = Math.abs(Math.cos(coin.rotation));
      
      // Subtle horizontal drift
      coin.x += Math.sin(coin.y * 0.01) * 0.2;

      // Reset coin if it goes off screen
      if (coin.y > dimensions.height + 20) {
        const newCoin = createCoin(coin.id);
        Object.assign(coin, newCoin);
      }

      // Keep within horizontal bounds
      if (coin.x < -10) coin.x = dimensions.width + 10;
      if (coin.x > dimensions.width + 10) coin.x = -10;
    };

    const drawCoin = (coin: Coin) => {
      ctx.save();
      ctx.translate(coin.x, coin.y);
      
      // Apply 3D scale for flip effect
      const scaleX = coin.scale * 0.7 + 0.3; // Min 0.3 to stay visible
      ctx.scale(scaleX, 1);

      const radius = coin.size;
      
      // Determine colors
      const goldGradient = participationRate >= 85;
      const baseColor = coin.isGold 
        ? (goldGradient ? '#F59E0B' : '#3B82F6')
        : '#3B82F6';
      const lightColor = coin.isGold 
        ? (goldGradient ? '#FCD34D' : '#60A5FA')
        : '#60A5FA';

      // Draw outer glow (simple circle, no blur)
      ctx.globalAlpha = coin.opacity * 0.2;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw coin body with gradient
      ctx.globalAlpha = coin.opacity;
      const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
      gradient.addColorStop(0, lightColor);
      gradient.addColorStop(0.7, baseColor);
      gradient.addColorStop(1, baseColor);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw coin border
      ctx.globalAlpha = coin.opacity * 0.8;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw "$" symbol (only when coin is facing front)
      if (coin.scale > 0.5) {
        ctx.globalAlpha = coin.opacity * coin.scale;
        ctx.fillStyle = isLight ? '#FFFFFF' : '#1E293B';
        ctx.font = `bold ${radius * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, radius * 0.1);
      }

      ctx.restore();

      // Simple trail (no gradient for performance)
      if (coin.speed > 1.5) {
        ctx.globalAlpha = coin.opacity * 0.25;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = radius * 0.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(coin.x, coin.y - 12);
        ctx.lineTo(coin.x, coin.y);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      if (isActive && intensity > 0) {
        // Update and draw all coins (no sorting for better performance)
        coinsRef.current.forEach((coin) => {
          updateCoin(coin);
          drawCoin(coin);
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    initCoins();
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, participationRate, coinCount, intensity, isActive, isLight]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0"
      style={{
        opacity: !isActive || intensity === 0 ? 0.3 : 0.85,
        transition: "opacity 1s ease-in-out",
      }}
    />
  );
};
