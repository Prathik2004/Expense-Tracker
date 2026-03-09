"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get("token");

            if (token) {
                try {
                    localStorage.setItem("token", token);

                    // Fetch user info with the token
                    const res = await api.get("/auth/me");
                    localStorage.setItem("user", JSON.stringify(res.data));

                    // Redirect to dashboard
                    router.replace("/");
                } catch (err) {
                    console.error("Auth callback failed", err);
                    router.replace("/login?error=OAuth failed");
                }
            } else {
                router.replace("/login?error=No token provided");
            }
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-zinc-500 animate-pulse">Completing login...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-zinc-500">Loading...</p>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
