"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export function NotificationBell() {
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.get("/notifications?limit=50");
                setUnread(response.data.data.filter((item: { readAt?: string }) => !item.readAt).length);
            } catch {
                // Notifications are optional and should not block the shell.
            }
        };
        const handleCreated = () => setUnread((value) => value + 1);
        void load();
        window.addEventListener("notification-created", handleCreated);
        return () => window.removeEventListener("notification-created", handleCreated);
    }, []);

    return (
        <Link href="/settings/notifications" className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
        </Link>
    );
}
