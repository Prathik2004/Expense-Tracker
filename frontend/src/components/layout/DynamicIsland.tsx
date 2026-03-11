"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notification.store';
import { CheckCircle2, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DynamicIsland() {
    const { isOpen, type, message, progress, hide } = useNotificationStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const variants = {
        idle: { width: 120, height: 36, borderRadius: 18 },
        loading: { width: 200, height: 44, borderRadius: 22 },
        success: { width: 180, height: 44, borderRadius: 22 },
        error: { width: 220, height: 44, borderRadius: 22 },
        sync: { width: 160, height: 44, borderRadius: 22 }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        layoutId="dynamic-island"
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            ...variants[type as keyof typeof variants]
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            layout: { duration: 0.4, ease: "circOut" }
                        }}
                        className="bg-zinc-950 text-white shadow-2xl border border-white/10 flex items-center justify-center px-4 overflow-hidden pointer-events-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center space-x-2 w-full whitespace-nowrap overflow-hidden"
                        >
                            {type === 'loading' && (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                            )}
                            {type === 'success' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            {type === 'error' && (
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            {type === 'sync' && (
                                <RefreshCcw className="w-4 h-4 animate-spin-slow text-purple-400 shrink-0" />
                            )}

                            <span className="text-[13px] font-medium truncate">
                                {message}
                            </span>

                            {type === 'loading' && typeof progress === 'number' && (
                                <div className="ml-2 w-12 h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
                                    <motion.div
                                        className="h-full bg-emerald-400"
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Add CSS for slow spin
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
        }
    `;
    document.head.appendChild(style);
}
