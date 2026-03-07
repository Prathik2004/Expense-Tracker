"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Loader2, Moon, Sun, LogOut, Wallet } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading, checkAuth, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !user && isMounted) {
            if (pathname !== '/login' && pathname !== '/register') {
                router.push('/login');
            }
        }
    }, [user, isLoading, router, pathname, isMounted]);

    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            <Sidebar />

            <main className="flex-1 w-full pb-20 md:pb-0 overflow-x-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
                    <div className="flex items-center space-x-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        <span className="text-lg font-bold tracking-tight">Expensify</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 text-zinc-500"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 text-zinc-500 hover:text-destructive"
                            onClick={logout}
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
