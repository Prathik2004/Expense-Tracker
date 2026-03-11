"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const DIGIT_HEIGHT = 32;

function Digit({ place, animatedValue }: { place: number; animatedValue: any }) {
    // We derive this digit's Y translation based on the total smooth animated value.
    // e.g., if animatedValue is 123.4, and place is 10 (tens place), 
    // the value for this digit should be (123.4 / 10) % 10 = 12.34 % 10 = 2.34

    // Math to get the "number of full rotations" + current fraction for this specific place value
    let y = useTransform(animatedValue, (latest: number) => {
        // Ensure we don't do weird math with negatives
        const val = Math.max(0, latest);

        // Calculate what number should be showing here (0-9) including fractional parts for rolling
        // For place = 1 (units), latest = 125, it should show 5.
        // For place = 10 (tens), latest = 125, it should show 2.

        const placeValue = (val / place) % 10;

        // Translate Y by -(value * height)
        // We use % 10 again on the height rendering so it loops visually if we had 10+ digits, 
        // but here we just render 0-9 and let Framer Motion interpolate the Y translation.

        // If place is larger than the value (e.g., place=100s, value=25), placeValue is 0.25
        // It should mostly sit at 0 until it hits 1.

        // To make it snap nicely and only roll the next digit when the previous passes 9,
        // we can simplify: just let it be a continuous continuous roll.

        let offset = placeValue % 10;

        // If offset is negative (shouldn't be due to Math.max), fix it
        if (offset < 0) offset += 10;

        return -(offset * DIGIT_HEIGHT);
    });

    return (
        <div className="relative h-8 overflow-hidden inline-block tabular-nums" style={{ width: '1ch' }}>
            <motion.div style={{ y }} className="absolute flex flex-col font-bold">
                {[...Array(10).keys(), ...Array(10).keys()].map((num, i) => (
                    // We duplicate the array to [0..9, 0..9] to allow for seamless visually continuing rolls
                    // However, since we modulo % 10 the Y transform, it will only ever show the first 0-9.
                    <div key={i} className="h-8 flex items-center justify-center">
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

    // A single spring drives the entire animation. 100 -> 500 smoothly.
    const animatedValue = useSpring(safeValue, {
        stiffness: 80,
        damping: 20, // slightly more damping to prevent overshoot on large numbers
        mass: 1,
    });

    useEffect(() => {
        animatedValue.set(safeValue);
    }, [animatedValue, safeValue]);

    // Figure out how many digits we need to show
    // We want to at least show '0' if value is 0.
    // If value is 1500, we need 4 digits (thousands, hundreds, tens, ones).
    const formattedString = safeValue.toLocaleString('en-IN');

    // We use the formatted string just to know where to place commas and how many digits
    const elements = [];
    let currentPlaceMultiplier = 1;

    for (let i = formattedString.length - 1; i >= 0; i--) {
        const char = formattedString[i];
        const distanceFromEnd = formattedString.length - 1 - i;

        if (/[0-9]/.test(char)) {
            elements.unshift(
                <Digit
                    key={`digit-${distanceFromEnd}`}
                    place={currentPlaceMultiplier}
                    animatedValue={animatedValue}
                />
            );
            currentPlaceMultiplier *= 10;
        } else {
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
