"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { ShieldCheck, Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startRegistration } from '@simplewebauthn/browser';

export default function SecurityPage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegisterBiometric = async () => {
        setIsLoading(true);
        setError("");
        try {
            // 1. Get options from server
            const optionsRes = await api.get('/passkey/register-options');

            // 2. Trigger browser biometric prompt
            const regRes = await startRegistration({ optionsJSON: optionsRes.data });

            // 3. Verify with server
            await api.post('/passkey/verify-registration', regRes);

            alert("Biometric login enabled successfully!");
        } catch (err: any) {
            console.error("Biometric registration failed", err);
            setError(err.message || "Biometric registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security</h1>
                    <p className="text-zinc-500">Manage your security and authentication settings.</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/20">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="p-6 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Fingerprint className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold">Biometric Login</h4>
                            <p className="text-sm text-zinc-500">Fast, passwordless access using your device's security.</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRegisterBiometric}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
                        Enable on this Device
                    </Button>
                </div>
            </div>

            <div className="p-6 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-zinc-500" />
                    <h4 className="font-semibold">Security Note</h4>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">
                    By enabling biometric login (Face ID, Touch ID, or Windows Hello), you can securely access your application without typing a password. You will be prompted to verify your identity every time you restart the application.
                </p>
            </div>
        </div>
    );
}
