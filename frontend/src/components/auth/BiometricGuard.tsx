"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { startAuthentication } from '@simplewebauthn/browser';
import api from '@/lib/api';
import { Fingerprint, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BiometricGuard({ children }: { children: React.ReactNode }) {
    const { user, token, isLoading, checkAuth } = useAuthStore();
    const [isVerified, setIsVerified] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        const checkBiometricStatus = async () => {
            if (isLoading) return;
            if (!token || !user) {
                setIsChecking(false);
                return;
            }

            // Check session storage first
            const sessionVerified = sessionStorage.getItem(`biometric_verified_${user.id}`);
            if (sessionVerified === 'true') {
                setIsVerified(true);
                setIsChecking(false);
                return;
            }

            try {
                // Check backend for registered passkeys
                const res = await api.get('/passkey/check');
                if (!res.data.hasAuthenticators) {
                    setIsVerified(true); // Bypass if no biometrics set up
                    setIsChecking(false);
                    return;
                }
                setIsChecking(false);
            } catch (err) {
                console.error("Failed to check biometric status", err);
                setIsChecking(false);
            }
        };

        checkBiometricStatus();
    }, [user, token, isLoading]);

    const handleUnlock = async () => {
        if (!user) return;
        setIsAuthenticating(true);
        setError("");
        try {
            // 1. Get login options (same as login page)
            const optionsRes = await api.post('/passkey/login-options', { email: user.email });

            // 2. Trigger biometric
            const authRes = await startAuthentication({ optionsJSON: optionsRes.data });

            // 3. Verify
            await api.post('/passkey/verify-login', { email: user.email, response: authRes });

            // 4. Success!
            sessionStorage.setItem(`biometric_verified_${user.id}`, 'true');
            setIsVerified(true);
        } catch (err: any) {
            console.error("Biometric verification failed", err);
            setError("Biometric verification failed. Please try again or re-login.");
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (isLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // If not logged in, just show children (the layout/routes will handle login redirect)
    if (!token || !user) {
        return <>{children}</>;
    }

    // If already verified for this session, show children
    if (isVerified) {
        return <>{children}</>;
    }

    // Otherwise, show the biometric lock screen
    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Lock className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">App Locked</h2>
            <p className="text-zinc-500 mb-8 max-w-xs">
                Please verify your identity with Face ID or Fingerprint to continue.
            </p>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 w-full max-w-xs">
                    {error}
                </div>
            )}

            <Button
                onClick={handleUnlock}
                className="w-full max-w-xs h-14 text-lg rounded-2xl shadow-lg shadow-primary/20"
                disabled={isAuthenticating}
            >
                {isAuthenticating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    <>
                        <Fingerprint className="w-6 h-6 mr-2" />
                        Unlock App
                    </>
                )}
            </Button>

            <button
                onClick={() => useAuthStore.getState().logout()}
                className="mt-8 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                type="button"
            >
                Sign out and use password
            </button>

            <div className="mt-auto pt-8 flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Secured with WebAuthn</span>
            </div>
        </div>
    );
}
