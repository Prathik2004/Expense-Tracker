"use client";

import { useRef } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Trash2, Copy } from "lucide-react";
import { format } from "date-fns";

interface TransactionRowProps {
    transaction: any;
    onDelete: (id: string) => void;
    onCopy: (transaction: any) => void;
    onEdit: (transaction: any) => void;
}

export function TransactionRow({ transaction, onDelete, onCopy, onEdit }: TransactionRowProps) {
    const controls = useAnimation();
    const isDragging = useRef(false);

    const handleDragStart = () => {
        isDragging.current = true;
    };

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = 60; // Lower threshold for better mobile feel
        if (info.offset.x < -threshold) {
            // Swipe Left -> Delete
            onDelete(transaction._id);
        } else if (info.offset.x > threshold) {
            // Swipe Right -> Copy
            onCopy(transaction);
        }

        // Always snap back
        await controls.start({ x: 0 });

        // Small delay to prevent tap event from firing
        setTimeout(() => {
            isDragging.current = false;
        }, 100);
    };

    const handleTap = () => {
        if (!isDragging.current) {
            onEdit(transaction);
        }
    };

    return (
        <div className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            {/* Background Actions */}
            <div className="absolute inset-0 flex justify-between items-center px-6">
                <div className="flex items-center text-blue-500">
                    <Copy className="w-5 h-5 mr-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Copy</span>
                </div>
                <div className="flex items-center text-rose-500">
                    <span className="text-xs font-bold uppercase tracking-wider mr-2">Delete</span>
                    <Trash2 className="w-5 h-5" />
                </div>
            </div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 bg-white dark:bg-zinc-950 p-4 flex items-center justify-between touch-pan-y cursor-grab active:cursor-grabbing"
                onTap={handleTap}
            >
                <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'expense' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' :
                        transaction.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' :
                            'bg-purple-50 text-purple-600 dark:bg-purple-950/30'
                        }`}>
                        <span className="text-xs font-bold">{transaction.category[0]}</span>
                    </div>
                    <div>
                        <div className="font-medium text-sm">{transaction.description || transaction.category}</div>
                        <div className="text-xs text-zinc-500">{format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.category}</div>
                    </div>
                </div>
                <div className={`font-semibold ${transaction.type === 'expense' ? 'text-zinc-900 dark:text-zinc-100' :
                    transaction.type === 'income' ? 'text-emerald-600' :
                        'text-purple-600'
                    }`}>
                    {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
                </div>
            </motion.div>
        </div>
    );
}
