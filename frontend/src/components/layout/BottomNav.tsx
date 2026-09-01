"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Target,
    PieChart,
    BarChart3,
    HandCoins,
} from 'lucide-react';

const navItems = [
    { href: '/',            label: 'Overview',      icon: LayoutDashboard },
    { href: '/transactions', label: 'Activity',     icon: ArrowRightLeft },
    { href: '/portfolio',   label: 'Portfolio',    icon: BarChart3 },
    { href: '/lending',     label: 'Lending',       icon: HandCoins },
    { href: '/goals',       label: 'Goals',         icon: Target },
    { href: '/budgets',     label: 'Budgets',       icon: PieChart },
];

export function BottomNav() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setIsMounted(true), 150);
        return () => clearTimeout(t);
    }, []);

    if (!isMounted) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
            <div className="absolute inset-0 bg-card/95 dark:bg-card/95 backdrop-blur-sm border-t border-border" />
            <div className="relative grid grid-cols-6 h-14">
                {navItems.map((item) => {
                    const isAdminItem = (item as any).adminOnly;
                    if (isAdminItem && user?.email !== 'prathik1611@gmail.com') return null;
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center h-full w-full relative">
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary rounded-full" />
                            )}
                            <div className={`flex flex-col items-center gap-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                                <span className="text-[9px] font-medium leading-none">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}