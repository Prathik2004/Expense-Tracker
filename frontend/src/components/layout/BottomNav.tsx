"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Target,
    //PieChart,
    BarChart3,
    HandCoins,
    //Shield,
    DollarSign
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/transactions', label: 'Activity', icon: ArrowRightLeft },
    { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
    { href: '/lending', label: 'Lending', icon: HandCoins },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/liquid-funds', label: 'Liquid Funds', icon: DollarSign },
    // /{ href: '/budgets', label: 'Budgets', icon: PieChart },
];

export function BottomNav() {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Defer mounting slightly to avoid competing with LCP on slow devices
        const timer = setTimeout(() => setIsMounted(true), 150);
        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50">
            <div className="grid h-16 w-full grid-cols-7 px-0.5">
                {navItems.map((item) => {
                    const isAdminItem = (item as any).adminOnly;
                    if (isAdminItem && user?.email !== 'prathik1611@gmail.com') return null;

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="flex h-full min-w-0 flex-col items-center justify-center px-0.5">
                            <div className={`flex flex-col items-center justify-center space-y-1 ${isActive ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                <Icon className={`w-4.5 h-4.5 ${isActive ? 'fill-primary/20' : ''}`} />
                                <span className="max-w-full truncate text-[8px] font-medium leading-none">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
