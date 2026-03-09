"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Shield, Smartphone, Monitor, Globe, Clock, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export default function SecurityPage() {
    const { user } = useAuthStore();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const isAdmin = user?.email === 'prathik1611@gmail.com';

    useEffect(() => {
        if (isAdmin) {
            fetchSessions();
        }
    }, [isAdmin]);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/security/sessions');
            setSessions(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load sessions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (sessionId: string) => {
        setRevokingId(sessionId);
        try {
            await api.delete(`/security/sessions/${sessionId}`);
            setSessions(sessions.filter(s => s.sessionId !== sessionId));
        } catch (err) {
            console.error("Failed to revoke session", err);
        } finally {
            setRevokingId(null);
        }
    };

    const handleLogoutOthers = async () => {
        if (!confirm("This will log you out of all other devices. Continue?")) return;
        setIsLoading(true);
        try {
            await api.post('/security/logout-others');
            // Re-fetch sessions to show only current one
            fetchSessions();
        } catch (err) {
            console.error("Failed to logout other devices", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <Shield className="w-16 h-16 text-rose-500 opacity-20" />
                <h1 className="text-2xl font-bold">Access Restricted</h1>
                <p className="text-zinc-500 max-w-sm">
                    This security dashboard is only available to system administrators.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Audit</h1>
                    <p className="text-zinc-500">Manage your active sessions and connected devices.</p>
                </div>
                <Button
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    onClick={handleLogoutOthers}
                    disabled={isLoading || sessions.length <= 1}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout Other Devices
                </Button>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/20">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <p className="text-center py-12 text-zinc-500">No active sessions found.</p>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.sessionId}
                            className={`flex items-center justify-between p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all ${!session.isValid ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl">
                                    {session.deviceType === 'mobile' ? (
                                        <Smartphone className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                                    ) : (
                                        <Monitor className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                                            {session.deviceType || 'Unknown'} Device
                                            {session.sessionId === localStorage.getItem('sessionId') && (
                                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                    Current
                                                </span>
                                            )}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5" />
                                            {session.ip || 'Local IP'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            Active {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-md">
                                        {session.userAgent || 'Unknown browser'}
                                    </p>
                                </div>
                            </div>

                            {session.isValid && session.sessionId !== localStorage.getItem('sessionId') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => handleRevoke(session.sessionId)}
                                    disabled={revokingId === session.sessionId}
                                >
                                    {revokingId === session.sessionId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <h4 className="font-semibold mb-2">Security Note</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">
                    If you see a login from a location or device you don't recognize, revoke the session immediately and consider changing your password. Logins are tracked automatically for your safety.
                </p>
            </div>
        </div>
    );
}
