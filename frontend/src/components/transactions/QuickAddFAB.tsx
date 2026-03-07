"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

interface QuickAddFABProps {
    onClick?: () => void;
}

export function QuickAddFAB({ onClick }: QuickAddFABProps) {
    const classes = "fixed bottom-20 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-zinc-950 cursor-pointer";

    if (onClick) {
        return (
            <button onClick={onClick} className={classes} aria-label="Add transaction">
                <Plus className="w-6 h-6" />
            </button>
        );
    }

    return (
        <Link href="/transactions?add=true" className={classes} aria-label="Add transaction">
            <Plus className="w-6 h-6" />
        </Link>
    );
}
