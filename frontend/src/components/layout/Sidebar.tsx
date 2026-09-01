"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Target,
    PieChart,
    LogOut,
    BarChart3,
    HandCoins,
    Moon,
    Sun,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const navItems = [
    { href: '/',         label: 'Overview',      icon: LayoutDashboard },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/portfolio',    label: 'Portfolio',   icon: BarChart3 },
    { href: '/lending',      label: 'Lending',     icon: HandCoins },
    { href: '/goals',         label: 'Goals',       icon: Target },
    { href: '/budgets',      label: 'Budgets',     icon: PieChart },
    { href: '/settings/integrations', label: 'Settings', icon: LayoutDashboard },
];

export function Sidebar() {
    const pathname = usePathname();
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore((s) => s.user);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <aside className="hidden md:flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs font-bold tracking-tight">E</span>
                </div>
                <span className="text-base font-semibold tracking-tight text-foreground">Expensify</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 pt-4 overflow-y-auto no-scrollbar space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                                ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
                            `}>
                                <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.2 : 2} />
                                {item.label}
                                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User + actions */}
            <div className="p-3 border-t border-border space-y-1">
                {user && (
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[11px] font-bold shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground h-8 px-3 text-sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    {mounted && theme === 'dark'
                        ? <Sun className="w-4 h-4 mr-2.5" />
                        : <Moon className="w-4 h-4 mr-2.5" />}
                    {mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive h-8 px-3 text-sm"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Sign out
                </Button>
            </div>
        </aside>
    );
}