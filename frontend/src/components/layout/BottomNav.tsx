"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Target,
    PieChart,
    BarChart3,
    HandCoins,
    Shield
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/transactions', label: 'Activity', icon: ArrowRightLeft },
    { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
    { href: '/lending', label: 'Lending', icon: HandCoins },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/budgets', label: 'Budgets', icon: PieChart },
];

export function BottomNav() {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50">
            <div className="flex items-center h-16 overflow-x-auto no-scrollbar px-2 space-x-1">
                {navItems.map((item) => {
                    const isAdminItem = (item as any).adminOnly;
                    if (isAdminItem && user?.email !== 'prathik1611@gmail.com') return null;

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="flex-none min-w-[70px]">
                            <div className={`flex flex-col items-center justify-center h-full w-full space-y-1 ${isActive ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
