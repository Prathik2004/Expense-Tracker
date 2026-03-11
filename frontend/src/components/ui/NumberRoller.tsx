"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

// The height of a single digit container (matches text-2xl line-height roughly)
const DIGIT_HEIGHT = 32;

function Digit({ place, value }: { place: number; value: number }) {
    // The value goes from 0 to 9, so we translate Y by -(value * height)
    const spring = useSpring(value * DIGIT_HEIGHT, {
        stiffness: 80, // Lower stiffness = slower, more satisfying mechanical feel
        damping: 15,   // Higher damping = less bouncy, more "heavy machinery"
        mass: 1,
    });

    useEffect(() => {
        spring.set(value * DIGIT_HEIGHT);
    }, [spring, value]);

    // Create the column of digits 0-9
    const y = useTransform(spring, (latest) => -latest);

    return (
        <div className="relative h-8 overflow-hidden inline-block tabular-nums" style={{ width: '1ch' }}>
            <motion.div style={{ y }} className="absolute flex flex-col font-bold">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="h-8 flex items-center justify-center">
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
    // Ensure we handle non-negative numbers safely for the animation
    const safeValue = Math.max(0, Math.floor(value));

    // We want the numbers to format correctly with Indian commas (crores, lakhs)
    // Example: 1,50,000. 
    // Since animating commas dynamically shifts the entire layout, 
    // we split the formatted string to render static commas and animated digits.
    const formattedString = safeValue.toLocaleString('en-IN');

    const elements = [];
    let digitIndex = 0; // Keep track of digit positions if we needplace multipliers

    for (let i = formattedString.length - 1; i >= 0; i--) {
        const char = formattedString[i];
        const distanceFromEnd = formattedString.length - 1 - i;

        if (/[0-9]/.test(char)) {
            // It's a digit, render a rolling component
            elements.unshift(
                <Digit key={`digit-${distanceFromEnd}`} place={digitIndex} value={parseInt(char, 10)} />
            );
            digitIndex++;
        } else {
            // It's a comma or formatting character, render statically to avoid jumping
            elements.unshift(
                <span key={`static-${distanceFromEnd}`} className="inline-flex h-8 items-end text-zinc-400 font-bold mb-[-4px]">
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
