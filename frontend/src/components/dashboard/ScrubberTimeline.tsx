"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { hapticLight } from "@/lib/haptic";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ScrubberTimelineProps {
    value: number; // 0-11
    onChange: (value: number) => void;
}

export function ScrubberTimeline({ value, onChange }: ScrubberTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bounds, setBounds] = useState({ width: 0, left: 0 });
    const x = useMotionValue(0);

    // Track the last emitted value to prevent redundant onChange calls
    const lastEmittedValue = useRef(value);

    // Calculate layout bounds on mount and resize
    useEffect(() => {
        const updateBounds = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setBounds({ width: rect.width, left: rect.left });
                // Initialize handle position based on value
                // Handle width is 40px (w-10), so movable area is width - 40
                const movableWidth = rect.width - 40;
                const initialX = (value / 11) * movableWidth;
                x.set(initialX);
            }
        };

        updateBounds();
        window.addEventListener('resize', updateBounds);
        return () => window.removeEventListener('resize', updateBounds);
    }, [value, x]); // Dependency on value so external changes (like initial load) snap the handle

    // Logic to convert raw X pixel value to a 0-11 month index
    const calculateMonthFromX = (currentX: number) => {
        const movableWidth = Math.max(1, bounds.width - 40);
        // Map currentX (0 to movableWidth) to a 0-1 percentage
        let percentage = currentX / movableWidth;
        percentage = Math.max(0, Math.min(1, percentage)); // Clamp between 0 and 1

        // Map percentage to 0-11 integer
        return Math.round(percentage * 11);
    };

    // Handle Framer Motion's onChange event for the X value
    useEffect(() => {
        const unsubscribe = x.onChange((latestX) => {
            const calculatedMonth = calculateMonthFromX(latestX);

            if (calculatedMonth !== lastEmittedValue.current) {
                hapticLight(); // Provide a physical tick every time it snaps to a new month
                lastEmittedValue.current = calculatedMonth;
                onChange(calculatedMonth);
            }
        });
        return unsubscribe;
    }, [x, bounds.width, onChange]);

    // Spring interpolation to visually smoothly expand the "active" track behind the handle
    const activeTrackWidth = useTransform(x, (latestX) => latestX + 20); // +20 to reach center of handle

    return (
        <div className="w-full max-w-2xl mx-auto py-6 relative select-none touch-none">
            {/* Visually hidden label for screen readers */}
            <div id="scrubber-label" className="sr-only">Select Month</div>

            <div
                ref={containerRef}
                className="relative h-12 flex items-center w-full"
                onTouchStart={() => {
                    // Ensure touch actions don't scroll the page while grabbing
                    document.body.style.overflow = "hidden";
                }}
                onTouchEnd={() => {
                    document.body.style.overflow = "";
                }}
            >
                {/* Background Empty Track */}
                <div className="absolute w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    {/* Tick marks for each month */}
                    <div className="absolute inset-0 flex justify-between px-2">
                        {MONTHS.map((_, i) => (
                            <div key={i} className="w-[2px] h-full bg-zinc-300 dark:bg-zinc-700/50" />
                        ))}
                    </div>
                </div>

                {/* Filled Active Track */}
                <motion.div
                    className="absolute h-2 bg-emerald-500 rounded-full"
                    style={{ width: activeTrackWidth }}
                />

                {/* Draggable Playhead/Handle */}
                <motion.div
                    className="absolute w-10 h-10 bg-white dark:bg-zinc-100 rounded-full shadow-lg border-2 border-emerald-500 flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                    style={{ x }}
                    drag="x"
                    dragConstraints={containerRef}
                    dragElastic={0} // No bouncy overscroll pull, strict constraints
                    dragMomentum={false} // Immediately stop when let go, no sliding friction
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </motion.div>

            </div>

            {/* Labels beneath the track */}
            <div className="flex justify-between mt-2 px-2 text-xs font-semibold text-zinc-400">
                {MONTHS.map((m, i) => (
                    <span
                        key={m}
                        className={`w-6 text-center transition-colors ${value === i ? 'text-zinc-900 dark:text-white' : ''}`}
                    >
                        {m === 'Jan' || m === 'Dec' || value === i ? m : '·'}
                    </span>
                ))}
            </div>
        </div>
    );
}
