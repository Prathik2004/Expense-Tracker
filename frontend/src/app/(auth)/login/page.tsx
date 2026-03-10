"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Fingerprint, Loader2 } from 'lucide-react';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { startAuthentication } from '@simplewebauthn/browser';
import api from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const setToken = useAuthStore((state) => state.setToken);
    const setUser = useAuthStore((state) => state.setUser);
    const router = useRouter();
    const [isBiometricSupported, setIsBiometricSupported] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && !window.PublicKeyCredential) {
            setIsBiometricSupported(false);
        }
    }, []);

    const handleBiometricLogin = async () => {
        if (!email) {
            setError("Please enter your email first to use biometric login.");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            // 1. Get login options
            const optionsRes = await api.post('/passkey/login-options', { email });

            // 2. Trigger biometric
            const authRes = await startAuthentication({ optionsJSON: optionsRes.data });

            // 3. Verify
            const verifyRes = await api.post('/passkey/verify-login', { email, response: authRes });

            // 4. Success!
            const { access_token, user, sessionId } = verifyRes.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            if (sessionId) localStorage.setItem('sessionId', sessionId);

            // Update store
            setToken(access_token);
            setUser(user);

            router.push('/');
        } catch (err: any) {
            console.error("Biometric login failed", err);
            const msg = err.response?.data?.message || err.message || "";
            if (msg.includes("no passkey available") || err.name === "NotAllowedError") {
                setError("No passkey found for this email. Please sign in with your password first and enable biometric login in Security Settings.");
            } else {
                setError(msg || "Biometric login failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({ email, password });
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Wallet className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                            </div>
                        </div>

                        <GoogleLoginButton />

                        {isBiometricSupported && (
                            <Button
                                variant="outline"
                                className="w-full border-primary/20 hover:bg-primary/5 text-primary"
                                type="button"
                                onClick={handleBiometricLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
                                Sign in with Face ID / Fingerprint
                            </Button>
                        )}

                        <div className="text-sm text-center text-zinc-500 pt-2">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
