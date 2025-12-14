"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LoadingStatus = "initializing" | "loading" | "building" | "ready";

export type { LoadingStatus };

interface LoadingScreenProps {
    isLoading: boolean;
    progress: number;
    status: LoadingStatus;
    onSkip?: () => void;
    variant?: "full" | "minimal";
}

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    opacityDirection: 1 | -1;
    speedX: number;
    speedY: number;
    drift: number;
}

interface ContourRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const PARTICLE_COLORS = ["#FF0080", "#00D4AA", "#FFA500"];

const STATUS_MESSAGES: Record<LoadingStatus, string> = {
    initializing: "Initializing dashboard...",
    loading: "Loading network data...",
    building: "Building your view...",
    ready: "Ready! Launching...",
};

const HEADLINE_MESSAGES: Record<LoadingStatus, string> = {
    initializing: "Materializing telemetry",
    loading: "Aligning network mesh",
    building: "Stabilizing dashboard",
    ready: "Clearing to display",
};

const usePrefersReducedMotion = () => {
    const [prefers, setPrefers] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setPrefers(mediaQuery.matches);
        updatePreference();
        mediaQuery.addEventListener("change", updatePreference);
        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, []);

    return prefers;
};

const getCanvasSize = (width: number) => {
    if (width < 640) {
        return { width: width - 32, height: 240 };
    }
    if (width < 1024) {
        return { width: 520, height: 320 };
    }
    return { width: 720, height: 420 };
};

const getParticleCount = (width: number) => {
    if (width < 640) return 50;
    if (width < 1024) return 90;
    return 140;
};

const createParticle = (width: number, height: number): Particle => {
    const speedScale = width < 768 ? 0.6 : 1;
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1.5 + Math.random() * 2.5,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        opacity: 0.3 + Math.random() * 0.7,
        opacityDirection: Math.random() > 0.5 ? 1 : -1,
        speedX: (Math.random() - 0.5) * 0.4 * speedScale,
        speedY: (0.4 + Math.random() * 0.6) * speedScale,
        drift: Math.random() * Math.PI * 2,
    };
};

const drawContours = (
    ctx: CanvasRenderingContext2D,
    rectangles: ContourRect[],
    status: LoadingStatus,
    normalizedProgress: number,
    timestamp: number,
    canvasWidth: number,
    canvasHeight: number
) => {
    if (rectangles.length === 0) return;

    const outlineAlpha: Record<LoadingStatus, number> = {
        initializing: 0,
        loading: 0.75,
        building: 0.85,
        ready: 1,
    };

    const fillAlpha: Record<LoadingStatus, number> = {
        initializing: 0,
        loading: 0,
        building: 0.15,
        ready: 0.25,
    };

    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#00D4AA");
    gradient.addColorStop(0.5, "#FF0080");
    gradient.addColorStop(1, "#FFA500");

    rectangles.forEach((rect, index) => {
        const reveal = Math.min(1, Math.max(0, normalizedProgress + 0.15 - index * 0.02));
        const perimeter = 2 * (rect.width + rect.height);

        ctx.save();
        ctx.globalAlpha = outlineAlpha[status];
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = gradient;
        ctx.setLineDash([perimeter]);
        ctx.lineDashOffset = perimeter * (1 - reveal);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();

        if (fillAlpha[status] > 0) {
            ctx.save();
            ctx.globalAlpha = fillAlpha[status];
            ctx.fillStyle = "rgba(15,23,66,0.9)";
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            ctx.restore();
        }

        if (status === "ready") {
            ctx.save();
            const shimmerGradient = ctx.createLinearGradient(
                rect.x - rect.width,
                rect.y,
                rect.x + rect.width * 2,
                rect.y
            );
            shimmerGradient.addColorStop(0, "rgba(255,255,255,0)");
            shimmerGradient.addColorStop(0.5, "rgba(255,255,255,0.65)");
            shimmerGradient.addColorStop(1, "rgba(255,255,255,0)");
            ctx.globalAlpha = 0.3;
            ctx.translate(((timestamp / 6) + index * 18) % rect.width, 0);
            ctx.fillStyle = shimmerGradient;
            ctx.fillRect(rect.x - rect.width, rect.y, rect.width * 3, rect.height);
            ctx.restore();
        }
    });
};

const LoadingScreen = ({
    isLoading,
    progress,
    status,
    onSkip,
    variant = "full",
}: LoadingScreenProps) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [viewportWidth, setViewportWidth] = useState(1280);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const progressClamped = Math.min(100, Math.max(0, progress));
    const effectiveVariant = variant === "full" && !prefersReducedMotion ? "full" : "minimal";
    const canvasSize = useMemo(() => getCanvasSize(viewportWidth), [viewportWidth]);
    const particleCount = useMemo(() => {
        if (effectiveVariant === "minimal") return 40;
        return getParticleCount(viewportWidth);
    }, [effectiveVariant, viewportWidth]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const updateWidth = () => setViewportWidth(window.innerWidth);
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        if (!isLoading || !onSkip) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onSkip();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLoading, onSkip]);

    useEffect(() => {
        if (effectiveVariant !== "full") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = canvasSize.width * dpr;
        canvas.height = canvasSize.height * dpr;
        canvas.style.width = `${canvasSize.width}px`;
        canvas.style.height = `${canvasSize.height}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }, [canvasSize, effectiveVariant]);

    useEffect(() => {
        if (effectiveVariant !== "full") return;
        particlesRef.current = Array.from({ length: particleCount }, () =>
            createParticle(canvasSize.width, canvasSize.height)
        );
    }, [canvasSize, effectiveVariant, particleCount]);

    useEffect(() => {
        if (!isLoading || effectiveVariant !== "full") return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        let animationId: number;
        let lastTime = 0;
        const fps = prefersReducedMotion ? 20 : 30;
        const interval = 1000 / fps;

        const contourRects: ContourRect[] = (() => {
            const rects: ContourRect[] = [];
            const topSectionHeight = canvasSize.height * 0.55;
            const paddingX = 24;
            const paddingY = 24;
            const gapX = 18;
            const gapY = 16;
            const cols = 4;
            const rows = 2;
            const cardWidth = (canvasSize.width - paddingX * 2 - gapX * (cols - 1)) / cols;
            const cardHeight = (topSectionHeight - paddingY * 2 - gapY * (rows - 1)) / rows;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    rects.push({
                        x: paddingX + col * (cardWidth + gapX),
                        y: paddingY + row * (cardHeight + gapY),
                        width: cardWidth,
                        height: cardHeight,
                    });
                }
            }

            const chartY = topSectionHeight + 28;
            const chartGap = 18;
            const chartHeight = canvasSize.height - chartY - paddingY;
            const chartWidth = (canvasSize.width - paddingX * 2 - chartGap * 3) / 4;

            for (let i = 0; i < 4; i++) {
                rects.push({
                    x: paddingX + i * (chartWidth + chartGap),
                    y: chartY,
                    width: chartWidth,
                    height: chartHeight,
                });
            }

            return rects;
        })();

        const render = (timestamp: number) => {
            animationId = requestAnimationFrame(render);
            if (timestamp - lastTime < interval) {
                return;
            }
            lastTime = timestamp;

            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

            particlesRef.current.forEach((particle) => {
                particle.y -= particle.speedY;
                particle.x += particle.speedX + Math.cos(particle.drift + timestamp / 1200) * 0.15;
                particle.opacity += 0.01 * particle.opacityDirection;

                if (particle.opacity > 1 || particle.opacity < 0.2) {
                    particle.opacityDirection *= -1;
                }

                if (particle.y < -10) particle.y = canvasSize.height + 10;
                if (particle.x < -10) particle.x = canvasSize.width + 10;
                if (particle.x > canvasSize.width + 10) particle.x = -10;

                ctx.save();
                ctx.globalAlpha = Math.min(Math.max(particle.opacity, 0.15), 1);
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            drawContours(
                ctx,
                contourRects,
                status,
                progressClamped / 100,
                timestamp,
                canvasSize.width,
                canvasSize.height
            );
        };

        animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [effectiveVariant, isLoading, progressClamped, status, canvasSize, prefersReducedMotion]);

    const renderMaterializationZone = useCallback(() => {
        if (effectiveVariant !== "full") {
            return (
                <div className="flex flex-col items-center justify-center gap-6 py-16">
                    <div className="w-16 h-16 border-4 border-[#00D4AA] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs uppercase tracking-[0.4em] text-[#9FB5FF]">
                        Syncing nodes
                    </p>
                </div>
            );
        }

        return (
            <div
                className="relative w-full max-w-5xl flex items-center justify-center"
                style={{ height: `${canvasSize.height}px` }}
            >
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute inset-0 rounded-4xl border border-white/5 pointer-events-none" />
            </div>
        );
    }, [canvasSize.height, effectiveVariant]);

    return (
        <motion.div
            className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#0A0E27]/98"
            initial={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Loading Xandeum dashboard"
        >
            <motion.div
                className="absolute -inset-32 opacity-30 blur-3xl"
                style={{
                    background:
                        "radial-gradient(circle at 20% 20%, #FF0080 0%, transparent 50%)," +
                        "radial-gradient(circle at 80% 20%, #FFA500 0%, transparent 50%)," +
                        "radial-gradient(circle at 50% 80%, #00D4AA 0%, transparent 50%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex flex-col items-center w-full h-full px-6 py-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mt-4"
                >
                    <Image
                        src="/xandeum_dark.png"
                        alt="Xandeum logo"
                        width={220}
                        height={80}
                        className="object-contain drop-shadow-[0_0_20px_rgba(0,212,170,0.35)]"
                        style={{ width: 220, height: 80 }}
                        priority
                    />
                </motion.div>

                <div className="flex-1 w-full flex items-center justify-center">
                    {renderMaterializationZone()}
                </div>

                <div className="w-full max-w-xl text-center" role="status" aria-live="polite">
                    <p className="text-sm uppercase tracking-[0.5em] text-[#9FB5FF]">
                        Loading Dashboard...
                    </p>
                    <p className="text-lg text-white mt-3">
                        {HEADLINE_MESSAGES[status]}
                    </p>
                </div>

                <div className="w-full max-w-xl mt-6">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Preparing your network view</span>
                        <span className="font-mono text-gray-200">{Math.round(progressClamped)}%</span>
                    </div>
                    <div
                        className="h-1.5 w-full bg-[#1F2348] rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progressClamped)}
                        aria-valuetext={`${Math.round(progressClamped)} percent`}
                    >
                        <div
                            className="h-full rounded-full shadow-[0_0_12px_rgba(0,212,170,0.8)]"
                            style={{
                                width: `${progressClamped}%`,
                                background: "linear-gradient(90deg, #14F195, #9945FF)",
                                transition: "width 300ms ease, opacity 300ms ease",
                            }}
                        />
                    </div>
                    <p className="text-sm text-gray-300 mt-3" aria-live="polite">
                        {STATUS_MESSAGES[status]}
                    </p>
                </div>

                {onSkip && (
                    <button
                        type="button"
                        onClick={onSkip}
                        className="absolute bottom-8 right-8 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        Skip animation →
                    </button>
                )}

                <p className="text-[11px] text-gray-500 mt-6">
                    Press ESC to skip · Session will remember this animation
                </p>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;
