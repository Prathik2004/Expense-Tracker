"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

// The height of a single digit container (matches text-2xl line-height roughly)
const DIGIT_HEIGHT = 32;

function Digit({ value }: { value: number }) {
    // We use a spring to hold the Y translation directly based on the numeric value (0-9).
    const spring = useSpring(value * DIGIT_HEIGHT, {
        stiffness: 80, // Lower stiffness = slower, satisfying mechanical feel
        damping: 15,   // Higher damping = less bouncy
        mass: 1,
    });

    // Store a ref to the previous value so we can handle rolling backwards perfectly
    const prevValueRef = useRef(value);

    useEffect(() => {
        const prev = prevValueRef.current;

        // If the number rolls from 9 to 0, or 0 to 9, it would normally snap across the whole strip.
        // For a true mechanical feel, it just translates to the target number.
        // Since we repeat 0-9 if needed, it works well.
        spring.set(value * DIGIT_HEIGHT);
        prevValueRef.current = value;
    }, [spring, value]);

    const y = useTransform(spring, (latest) => -latest);

    return (
        <div className="relative h-8 overflow-hidden inline-block tabular-nums" style={{ width: '1ch' }}>
            <motion.div style={{ y }} className="absolute flex flex-col font-bold w-full items-center text-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="h-8 flex items-center justify-center w-full">
                        {num}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

interface NumberRollerProps {
    value: number;
    className?: string;
}

export function NumberRoller({ value, className = "" }: NumberRollerProps) {
    const safeValue = Math.max(0, Math.floor(value));
    const formattedString = safeValue.toLocaleString('en-IN');

    // To prevent React from destroying digits when string length changes,
    // we assign a unique key based on its absolute position from the RIGHT (the decimal point).
    const elements = [];
    let digitCounter = 0; // Number of digits seen from the right

    for (let i = formattedString.length - 1; i >= 0; i--) {
        const char = formattedString[i];

        // Unique IDs based on position from the right
        const idFromRight = formattedString.length - 1 - i;

        if (/[0-9]/.test(char)) {
            elements.unshift(
                <Digit key={`digit-pos-${digitCounter}`} value={parseInt(char, 10)} />
            );
            digitCounter++;
        } else {
            // Render commas/static characters statically
            elements.unshift(
                <span key={`static-pos-${idFromRight}`} className="inline-flex h-8 items-end text-zinc-400 font-bold mb-[-4px] px-[1px]">
                    {char}
                </span>
            );
        }
    }

    return (
        <div className={`flex items-end ${className}`}>
            <span className="inline-flex h-8 items-center font-bold mr-1">₹</span>
            {elements}
        </div>
    );
}
