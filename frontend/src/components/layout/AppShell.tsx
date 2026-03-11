"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Loader2, Moon, Sun, LogOut, Wallet } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { io } from 'socket.io-client';
import { CommandPalette } from './CommandPalette';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { Toaster } from 'sonner';
import { DynamicIsland } from './DynamicIsland';
import { useNotificationStore } from '@/store/notification.store';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading, checkAuth, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [smartTransactionData, setSmartTransactionData] = useState<any>(null);

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

    // WebSocket real-time sync setup
    useEffect(() => {
        if (user && user._id) {
            let socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            // If it doesn't start with http, and it's not localhost, prepend https://
            if (!socketUrl.startsWith('http') && !socketUrl.includes('localhost')) {
                socketUrl = `https://${socketUrl}`;
            }

            // Strip any trailing /api to ensure socket connects to root namespace
            socketUrl = socketUrl.replace(/\/api\/?$/, '');

            const socket = io(socketUrl, {
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                socket.emit('join_room', user._id);
            });

            const handleSync = () => {
                window.dispatchEvent(new CustomEvent('sync_transactions'));
            };

            socket.on('transaction_added', handleSync);
            socket.on('transaction_updated', handleSync);
            socket.on('transaction_deleted', handleSync);
            socket.on('transactions_bulk_added', handleSync);

            return () => {
                socket.disconnect();
            };
        }
    }, [user]);

    // Listener for Smart Actions from Cmd+K
    useEffect(() => {
        const handleOpenSmartAdd = (e: any) => {
            setSmartTransactionData(e.detail);
            setIsAddModalOpen(true);
        };
        window.addEventListener('open_smart_add_transaction', handleOpenSmartAdd);
        return () => window.removeEventListener('open_smart_add_transaction', handleOpenSmartAdd);
    }, []);

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
            <CommandPalette />
            <DynamicIsland />

            <main className="flex-1 w-full pb-20 md:pb-0 overflow-x-hidden">
                {/* Mobile Header */}
                <header className="flex md:!hidden items-center justify-between p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
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
            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setSmartTransactionData(null);
                }}
                onSuccess={() => { }}
                transaction={smartTransactionData}
            />
            <Toaster richColors position="bottom-right" />
        </div>
    );
}
