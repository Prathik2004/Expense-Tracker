"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Target,
    PieChart,
    LogOut,
    Wallet,
    BarChart3,
    HandCoins,
    Shield,
    Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/portfolio', label: 'Portfolio', icon: BarChart3 },
    { href: '/lending', label: 'Lending', icon: HandCoins },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/budgets', label: 'Budgets', icon: PieChart },
    { href: '/canvas', label: 'Canvas', icon: Workflow },
];

export function Sidebar() {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);
    const { theme, setTheme } = useTheme();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0">
            <div className="p-6 flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Wallet className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight">Expensify</span>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isAdminItem = (item as any).adminOnly;
                    const user = useAuthStore.getState().user;
                    if (isAdminItem && user?.email !== 'prathik1611@gmail.com') return null;

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <span className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-600 dark:text-zinc-400"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                    Toggle Theme
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
