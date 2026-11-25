"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ArrowRightLeft,
    BarChart3,
    DollarSign,
    HandCoins,
    LayoutDashboard,
    MoreHorizontal,
    Plane,
    Settings,
    Target,
    X,
} from "lucide-react";

const primaryItems = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/transactions", label: "Activity", icon: ArrowRightLeft },
    { href: "/trips", label: "Trips", icon: Plane },
];

const moreItems = [
    { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { href: "/lending", label: "Lending", icon: HandCoins },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/liquid-funds", label: "Liquid Funds", icon: DollarSign },
    { href: "/settings/notifications", label: "Settings", icon: Settings },
];

export function BottomNav() {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreIsActive = moreItems.some((item) => pathname.startsWith(item.href));

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 150);
        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) return null;

    return (
        <>
            {isMoreOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close more menu"
                        className="fixed inset-0 z-40 bg-black/20 md:hidden"
                        onClick={() => setIsMoreOpen(false)}
                    />
                    <section
                        role="dialog"
                        aria-label="More pages"
                        className="fixed inset-x-3 bottom-20 z-[60] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:hidden"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">More pages</h2>
                            <button
                                type="button"
                                aria-label="Close more menu"
                                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                onClick={() => setIsMoreOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {moreItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            <nav
                aria-label="Mobile navigation"
                className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white pb-safe dark:border-zinc-800 dark:bg-zinc-950 md:hidden"
            >
                <div className="grid h-16 w-full grid-cols-4 px-2">
                    {primaryItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                onClick={() => setIsMoreOpen(false)}
                                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                                    isActive ? "text-primary" : "text-zinc-500 dark:text-zinc-400"
                                }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "fill-primary/15" : ""}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        type="button"
                        aria-expanded={isMoreOpen}
                        aria-haspopup="dialog"
                        onClick={() => setIsMoreOpen((open) => !open)}
                        className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                            isMoreOpen || moreIsActive ? "text-primary" : "text-zinc-500 dark:text-zinc-400"
                        }`}
                    >
                        {isMoreOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
                        <span>More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
