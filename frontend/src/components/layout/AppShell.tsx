"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Loader2, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(() => import('./CommandPalette').then(mod => mod.CommandPalette), { ssr: false });
const AddTransactionModal = dynamic(() => import('@/components/transactions/AddTransactionModal').then(mod => mod.AddTransactionModal), { ssr: false });
const Toaster = dynamic(() => import('sonner').then(mod => mod.Toaster), { ssr: false });
const DynamicIsland = dynamic(() => import('./DynamicIsland').then(mod => mod.DynamicIsland), { ssr: false });
const PrivacyShield = dynamic(() => import('./PrivacyShield').then(mod => mod.PrivacyShield), { ssr: false });

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading, checkAuth, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [isGlobalDeferred, setIsGlobalDeferred] = useState(false);
    const { theme, setTheme } = useTheme();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [smartTransactionData, setSmartTransactionData] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
        checkAuth();
        const timer = setTimeout(() => setIsGlobalDeferred(true), 1500);
        return () => clearTimeout(timer);
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !user && isMounted) {
            if (pathname !== '/login' && pathname !== '/register') {
                router.push('/login');
            }
        }
    }, [user, isLoading, router, pathname, isMounted]);

    useEffect(() => {
        if (user && user._id) {
            let socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            if (!socketUrl.startsWith('http') && !socketUrl.includes('localhost')) {
                socketUrl = `https://${socketUrl}`;
            }
            socketUrl = socketUrl.replace(/\/api\/?$/, '');

            const setupSocket = async () => {
                const { io } = await import('socket.io-client');
                const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
                socket.on('connect', () => socket.emit('join_room', user._id));
                const handleSync = () => window.dispatchEvent(new CustomEvent('sync_transactions'));
                socket.on('transaction_added', handleSync);
                socket.on('transaction_updated', handleSync);
                socket.on('transaction_deleted', handleSync);
                socket.on('transactions_bulk_added', handleSync);
                return socket;
            };
            const socketPromise = setupSocket();
            return () => { socketPromise.then(s => s.disconnect()); };
        }
    }, [user]);

    useEffect(() => {
        const handler = (e: any) => { setSmartTransactionData(e.detail); setIsAddModalOpen(true); };
        window.addEventListener('open_smart_add_transaction', handler);
        return () => window.removeEventListener('open_smart_add_transaction', handler);
    }, []);

    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">E</span>
                    </div>
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            {isGlobalDeferred && <CommandPalette />}
            {isGlobalDeferred && <DynamicIsland />}
            {isGlobalDeferred && <PrivacyShield />}

            <main className="flex-1 w-full pb-20 md:pb-0 overflow-x-hidden">
                {/* Mobile Header */}
                <header className="flex md:!hidden items-center justify-between px-4 h-14 bg-card/80 dark:bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-[10px] font-bold">E</span>
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-foreground">Expensify</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost" size="icon"
                            className="w-9 h-9 text-muted-foreground hover:text-foreground"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                        <Button
                            variant="ghost" size="icon"
                            className="w-9 h-9 text-muted-foreground hover:text-destructive hover:bg-muted"
                            onClick={logout}
                        >
                            <LogOut className="w-4 h-4" />
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
                onClose={() => { setIsAddModalOpen(false); setSmartTransactionData(null); }}
                onSuccess={() => {}}
                transaction={smartTransactionData}
            />
            <Toaster richColors position="bottom-right" />
        </div>
    );
}