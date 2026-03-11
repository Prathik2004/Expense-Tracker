"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";

export function PrivacyShield() {
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsHidden(document.visibilityState === 'hidden');
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Also handle blur event for some browsers/system switchers
        const handleBlur = () => setIsHidden(true);
        const handleFocus = () => setIsHidden(false);

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    return (
        <AnimatePresence>
            {isHidden && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/30 dark:bg-zinc-950/30 backdrop-blur-2xl"
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
