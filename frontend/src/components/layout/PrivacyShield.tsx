"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";

export function PrivacyShield() {
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const sync = () => {
            const hidden = document.visibilityState === 'hidden' || !document.hasFocus();
            setIsHidden(hidden);
        };

        window.addEventListener("blur", sync);
        window.addEventListener("focus", sync);
        document.addEventListener("visibilitychange", sync);
        window.addEventListener("pagehide", sync);
        window.addEventListener("pageshow", sync);

        // Initial sync
        sync();

        return () => {
            window.removeEventListener("blur", sync);
            window.removeEventListener("focus", sync);
            document.removeEventListener("visibilitychange", sync);
            window.removeEventListener("pagehide", sync);
            window.removeEventListener("pageshow", sync);
        };
    }, []);

    return (
        <AnimatePresence>
            {isHidden && (
                <motion.div
                    initial={{ opacity: 1 }} // Instant for snapshot
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }} // Only affects exit
                    style={{ WebkitBackdropFilter: 'blur(40px)' }}
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-zinc-950 backdrop-blur-3xl touch-none"
                    onPointerMove={(e) => e.stopPropagation()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                            <Wallet className="w-8 h-8 text-white dark:text-zinc-900" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Expense Tracker
                        </h2>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
