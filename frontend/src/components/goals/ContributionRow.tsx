"use client";

import { useRef } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hapticWarning } from "@/lib/haptic";

interface ContributionRowProps {
    contribution: any;
    onDelete: (id: string) => void;
    getAssetColor: (type: string) => string;
    formatAssetType: (type: string) => string;
}

export function ContributionRow({ contribution, onDelete, getAssetColor, formatAssetType }: ContributionRowProps) {
    const controls = useAnimation();
    const isDragging = useRef(false);

    const handleDragStart = () => {
        isDragging.current = true;
    };

    const handleDragEnd = async (event: any, info: PanInfo) => {
        const threshold = -60;
        if (info.offset.x < threshold) {
            hapticWarning();
            onDelete(contribution._id);
        }
        await controls.start({ x: 0 });
        setTimeout(() => {
            isDragging.current = false;
        }, 100);
    };

    return (
        <div className="relative overflow-hidden group">
            {/* Mobile Background Delete Action */}
            <div className="absolute inset-0 flex justify-end items-center px-6 bg-rose-50 dark:bg-rose-950/20 md:hidden">
                <div className="flex items-center text-rose-600 dark:text-rose-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider mr-2">Delete</span>
                    <Trash2 className="w-4 h-4" />
                </div>
            </div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-between transition-colors md:hover:bg-zinc-50 md:dark:hover:bg-zinc-900"
            >
                <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-1.5">
                        <Badge variant="secondary" className={`${getAssetColor(contribution.assetType)} border-0 font-medium h-5 text-[10px]`}>
                            {formatAssetType(contribution.assetType)}
                        </Badge>
                        <span className="text-[10px] text-zinc-400">
                            {format(new Date(contribution.date), "MMM d, yyyy")}
                        </span>
                    </div>
                    {contribution.notes && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-1 max-w-[200px]">
                            "{contribution.notes}"
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-600 dark:text-emerald-500 text-sm">
                            +₹{contribution.amount.toLocaleString('en-IN')}
                        </div>
                    </div>

                    {/* Desktop Delete Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex h-8 w-8 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(contribution._id);
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
