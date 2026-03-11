"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { hapticLight } from "@/lib/haptic";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ScrubberTimelineProps {
    value: [number, number]; // [startMonth: 0-11, endMonth: 0-11]
    onChange: (value: [number, number]) => void;
}

export function ScrubberTimeline({ value, onChange }: ScrubberTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [bounds, setBounds] = useState({ width: 0, left: 0 });

    // We maintain two separate motion values for the left and right thumbs
    const xMin = useMotionValue(0);
    const xMax = useMotionValue(0);

    // Track last emitted to prevent over-firing
    const lastEmittedValue = useRef<[number, number]>(value);

    // Mount/Resize logic: set pixel positions based on month values (0-11)
    useEffect(() => {
        const updateBounds = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setBounds({ width: rect.width, left: rect.left });

                const handleWidth = 40; // width of the thumb
                // Total width minus 1 handle. We use 1 handle width because we want them to be able to overlap visually at the same index
                const movableWidth = rect.width - handleWidth;

                const initialXMin = (value[0] / 11) * movableWidth;
                const initialXMax = (value[1] / 11) * movableWidth;

                xMin.set(initialXMin);
                xMax.set(initialXMax);
            }
        };

        updateBounds();
        window.addEventListener('resize', updateBounds);
        return () => window.removeEventListener('resize', updateBounds);
    }, [value, xMin, xMax]);

    const calculateMonthFromX = (currentX: number) => {
        const handleWidth = 40;
        const movableWidth = Math.max(1, bounds.width - handleWidth);
        let percentage = currentX / movableWidth;
        percentage = Math.max(0, Math.min(1, percentage));
        return Math.round(percentage * 11);
    };

    // Watchers for Min Handle
    useEffect(() => {
        const unsubscribe = xMin.onChange((latestXMin) => {
            const calculatedMinMonth = calculateMonthFromX(latestXMin);
            const currentMaxMonth = lastEmittedValue.current[1];

            // Collision detection block
            if (calculatedMinMonth > currentMaxMonth) {
                // Instantly snap it back visually so it can't cross
                const handleWidth = 40;
                const movableWidth = Math.max(1, bounds.width - handleWidth);
                xMin.set((currentMaxMonth / 11) * movableWidth);
                return;
            }

            if (calculatedMinMonth !== lastEmittedValue.current[0]) {
                hapticLight();
                lastEmittedValue.current = [calculatedMinMonth, currentMaxMonth];
                onChange([calculatedMinMonth, currentMaxMonth]);
            }
        });
        return unsubscribe;
    }, [xMin, bounds.width, onChange]);

    // Watchers for Max Handle
    useEffect(() => {
        const unsubscribe = xMax.onChange((latestXMax) => {
            const calculatedMaxMonth = calculateMonthFromX(latestXMax);
            const currentMinMonth = lastEmittedValue.current[0];

            // Collision detection block
            if (calculatedMaxMonth < currentMinMonth) {
                // Instantly snap it back visually so it can't cross
                const handleWidth = 40;
                const movableWidth = Math.max(1, bounds.width - handleWidth);
                xMax.set((currentMinMonth / 11) * movableWidth);
                return;
            }

            if (calculatedMaxMonth !== lastEmittedValue.current[1]) {
                hapticLight();
                lastEmittedValue.current = [currentMinMonth, calculatedMaxMonth];
                onChange([currentMinMonth, calculatedMaxMonth]);
            }
        });
        return unsubscribe;
    }, [xMax, bounds.width, onChange]);


    // Active track styling between the two handles
    const activeTrackLeft = useTransform(xMin, (latestX) => latestX + 20); // Center of min handle
    const activeTrackWidth = useTransform(
        [xMin, xMax],
        ([min, max]) => Math.max(0, (max as number) - (min as number))
    );

    return (
        <div className="w-full max-w-2xl mx-auto py-6 relative select-none touch-none">
            <div id="scrubber-label" className="sr-only">Select Month Range</div>

            <div
                ref={containerRef}
                className="relative h-12 flex items-center w-full"
                onTouchStart={() => { document.body.style.overflow = "hidden"; }}
                onTouchEnd={() => { document.body.style.overflow = ""; }}
            >
                {/* Background Empty Track */}
                <div className="absolute w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex justify-between px-2">
                        {MONTHS.map((_, i) => (
                            <div key={i} className="w-[2px] h-full bg-zinc-300 dark:bg-zinc-700/50" />
                        ))}
                    </div>
                </div>

                {/* Filled Active Track (Between Handles) */}
                <motion.div
                    className="absolute h-2 bg-emerald-500 rounded-full"
                    style={{ left: activeTrackLeft, width: activeTrackWidth }}
                />

                {/* Left/Min Handle */}
                <motion.div
                    className="absolute w-10 h-10 bg-white dark:bg-zinc-100 rounded-full shadow-lg border-2 border-emerald-500 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                    style={{ x: xMin }}
                    drag="x"
                    dragConstraints={containerRef}
                    dragElastic={0}
                    dragMomentum={false}
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </motion.div>

                {/* Right/Max Handle */}
                <motion.div
                    className="absolute w-10 h-10 bg-white dark:bg-zinc-100 rounded-full shadow-lg border-2 border-emerald-500 flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
                    style={{ x: xMax }}
                    drag="x"
                    dragConstraints={containerRef}
                    dragElastic={0}
                    dragMomentum={false}
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </motion.div>

            </div>

            {/* Range Labels */}
            <div className="flex justify-between mt-2 px-2 text-xs font-semibold text-zinc-400">
                {MONTHS.map((m, i) => {
                    const isSelected = i >= value[0] && i <= value[1];
                    const isBoundary = m === 'Jan' || m === 'Dec' || i === value[0] || i === value[1];
                    return (
                        <span
                            key={m}
                            className={`w-6 text-center transition-colors ${isSelected ? 'text-zinc-900 dark:text-white' : ''}`}
                        >
                            {isBoundary ? m : '·'}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
