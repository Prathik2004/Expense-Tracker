"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Coffee, BusFront, ShoppingBag, PiggyBank, Briefcase } from "lucide-react";
import { hapticLight } from "@/lib/haptic";

interface QuickAddFABProps {
    onClick?: () => void;
    onSelectRadial?: (data: { type: "expense" | "income" | "investment", category: string }) => void;
}

const MENU_ITEMS = [
    { id: 'food', icon: Coffee, label: 'Food', color: 'bg-rose-500', type: 'expense', category: 'Food' },
    { id: 'transport', icon: BusFront, label: 'Transport', color: 'bg-rose-500', type: 'expense', category: 'Transport' },
    { id: 'shopping', icon: ShoppingBag, label: 'Shopping', color: 'bg-rose-500', type: 'expense', category: 'Shopping' },
    { id: 'investment', icon: PiggyBank, label: 'Invest', color: 'bg-purple-500', type: 'investment', category: 'Mutual Funds' },
    { id: 'salary', icon: Briefcase, label: 'Income', color: 'bg-emerald-500', type: 'income', category: 'Salary' },
];

const RADIUS = 90; // Pixels from center to items
const ACTIVATION_DISTANCE = 40; // Pixels needed to commit to a radial item

export function QuickAddFAB({ onClick, onSelectRadial }: QuickAddFABProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const fabRef = useRef<HTMLDivElement>(null);

    // Store drag start coordinates
    const dragOrigin = useRef<{ x: number, y: number } | null>(null);

    // Lock body scroll while using radial menu on mobile
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only react to primary pointer/touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.currentTarget.setPointerCapture(e.pointerId);

        // Use clientX/Y to track absolute screen space
        dragOrigin.current = { x: e.clientX, y: e.clientY };

        // Haptic feedback to acknowledge long press/interaction start
        hapticLight();

        // Delay opening menu slightly to distinguish from an instant tap, 
        // but fast enough to feel like a drag
        setTimeout(() => setIsMenuOpen(true), 150);
        setActiveIndex(null);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isMenuOpen || !dragOrigin.current) return;

        const dx = e.clientX - dragOrigin.current.x;
        // On screens, Y grows downwards. We invert it for standard math (up is positive)
        const dy = dragOrigin.current.y - e.clientY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        // If thumb hasn't moved far enough from center, no item is highlighted
        if (distance < ACTIVATION_DISTANCE) {
            if (activeIndex !== null) {
                setActiveIndex(null);
            }
            return;
        }

        // Calculate angle of thumb relative to origin (in degrees)
        // Math.atan2 takes (y, x) but we mapped standard cartesian coordinates
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        // Normalize angle to 0-360 starting from 12 o'clock and moving clockwise
        // Standard Math.atan2: Right=0, Top=90, Left=180/-180, Bottom=-90
        // We want Top=0, Right=90, Bottom=180, Left=270
        let clockAngle = 90 - angle;
        if (clockAngle < 0) clockAngle += 360;

        // Map the angle to the closest radial item
        // Items are spread 180 degrees over the top arc (from 270 left to 90 right)
        // Item 0 (Left): 270 deg -> -90 deg
        // Item 1 (Top Left): 315 deg -> -45 deg
        // Item 2 (Top): 0 deg
        // Item 3 (Top Right): 45 deg
        // Item 4 (Right): 90 deg

        // Define exact angle targets for the 5 items in a semi-circle over the top
        const angles = [270, 315, 0, 45, 90];

        let closestIndex = 0;
        let minDiff = 360;

        angles.forEach((targetAngle, i) => {
            let diff = Math.abs(clockAngle - targetAngle);
            if (diff > 180) diff = 360 - diff; // Take shortest path around circle

            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });

        // If the closest item differs from current, update state and hum
        if (closestIndex !== activeIndex) {
            hapticLight();
            setActiveIndex(closestIndex);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture(e.pointerId);

        // Calculate if it was just a quick tap (didn't drag far AND didn't hold long enough to really matter)
        let isQuickTap = true;
        if (dragOrigin.current) {
            const dx = e.clientX - dragOrigin.current.x;
            const dy = dragOrigin.current.y - e.clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > ACTIVATION_DISTANCE && isMenuOpen) {
                isQuickTap = false;
            }
        }

        // If quick tap, trigger standard behavior
        if (!isMenuOpen || isQuickTap) {
            if (onClick) onClick();
        }
        // If radial, trigger selected item
        else if (activeIndex !== null && onSelectRadial) {
            const selectedItem = MENU_ITEMS[activeIndex];
            // Use timeout to allow snap animation to process before opening modal
            setTimeout(() => {
                onSelectRadial({ type: selectedItem.type as any, category: selectedItem.category });
            }, 50);
        }

        // Reset
        setIsMenuOpen(false);
        setActiveIndex(null);
        dragOrigin.current = null;
    };

    return (
        <div className="fixed bottom-20 right-6 md:bottom-10 md:right-10 z-50 select-none touch-none">
            {/* Backdrop layer (dim background) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
                    />
                )}
            </AnimatePresence>

            {/* Radial Items */}
            <AnimatePresence>
                {isMenuOpen && MENU_ITEMS.map((item, index) => {
                    // Layout items in a semi-circle from Left (-90 deg) to Right (90 deg)
                    const angleOffsets = [-90, -45, 0, 45, 90];
                    const angleDeg = angleOffsets[index];
                    const angleRad = (angleDeg - 90) * (Math.PI / 180); // -90 adjusts 0 to face top

                    const tx = Math.cos(angleRad) * RADIUS;
                    const ty = Math.sin(angleRad) * RADIUS;

                    const isActive = activeIndex === index;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                            animate={{
                                x: tx,
                                y: ty,
                                opacity: 1,
                                scale: isActive ? 1.25 : 1
                            }}
                            exit={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                            transition={{
                                type: "spring",
                                damping: isActive ? 15 : 20,
                                stiffness: 300,
                                delay: isActive ? 0 : index * 0.02
                            }}
                            className={`absolute left-0 top-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl ${item.color} ${isActive ? 'ring-4 ring-white dark:ring-zinc-900 ring-offset-2 ring-offset-emerald-500' : ''}`}
                            style={{ pointerEvents: 'none' }} // Ensure thumb events pass through to FAB
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />

                            {/* Label bubbles for items */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: isActive ? 1 : 0, y: isActive ? -45 : 0 }}
                                className="absolute bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap"
                            >
                                {item.label}
                            </motion.div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* The core FAB */}
            <motion.div
                ref={fabRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onContextMenu={(e) => e.preventDefault()} // Block normal right click menu
                animate={{ scale: isMenuOpen ? 0.9 : 1 }}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-colors ${isMenuOpen ? 'bg-zinc-800 text-zinc-400' : 'bg-primary text-primary-foreground hover:shadow-xl hover:-translate-y-1'
                    }`}
                style={{ touchAction: 'none' }} // Prevent browser scrolling behavior entirely over the FAB
                aria-label="Quick Add Menu"
            >
                <motion.div
                    animate={{ rotate: isMenuOpen ? 45 : 0 }} // Rotate Plus into an X when open
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <Plus className="w-6 h-6" />
                </motion.div>
            </motion.div>
        </div>
    );
}
