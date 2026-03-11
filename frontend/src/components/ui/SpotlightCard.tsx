"use client";

import React, { useRef, useState } from "react";

export function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative rounded-xl bg-zinc-200/50 dark:bg-zinc-800/40 overflow-hidden shadow-sm ${className}`}
        >
            {/* The outer moving spotlight gradient that sits on the base layer.
                Because the inner layer is inset by 1px, this outer gradient bleeds through
                creating a perfect, illuminated 1px border. */}
            <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-500"
                style={{
                    opacity,
                    background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(16, 185, 129, 0.5), transparent 40%)`,
                }}
            />

            {/* The solid inner content mask. Hides the bright outer border-gradient everywhere except the 1px edge. */}
            <div className="absolute inset-[1px] rounded-[11px] bg-white dark:bg-zinc-950 z-0" />

            {/* A softer secondary spotlight that shines directly onto the card's inner face. */}
            <div
                className="pointer-events-none absolute inset-[1px] rounded-[11px] transition-opacity duration-500 z-10"
                style={{
                    opacity: opacity * 0.5,
                    background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(16, 185, 129, 0.15), transparent 40%)`,
                }}
            />

            {/* The actual card content */}
            <div className="relative z-20 h-full">
                {children}
            </div>
        </div>
    );
}
