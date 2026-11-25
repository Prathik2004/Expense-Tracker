"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface NotificationItem {
    _id: string;
    title: string;
    body: string;
    url: string;
    sentAt: string;
    readAt?: string;
    status: string;
}

interface NotificationResponse {
    data: NotificationItem[];
}

function formatSentAt(value: string) {
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function NotificationBell() {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [unread, setUnread] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const response = await api.get<NotificationResponse>("/notifications?limit=100");
                setUnread(response.data.data.filter((item) => item.status === "sent" && !item.readAt).length);
            } catch (loadError) {
                console.error("Could not load unread notification count", loadError);
            }
        };

        const handleCreated = (event: Event) => {
            const notification = (event as CustomEvent<NotificationItem>).detail;
            if (notification?.status && notification.status !== "sent") return;
            setUnread((value) => value + 1);
            if (notification?._id) {
                setNotifications((current) => [
                    notification,
                    ...current.filter((item) => item._id !== notification._id),
                ]);
            }
        };

        void loadUnreadCount();
        window.addEventListener("notification-created", handleCreated);
        return () => window.removeEventListener("notification-created", handleCreated);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const toggleNotifications = async () => {
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        setIsOpen(true);
        setIsLoading(true);
        setError("");

        try {
            const response = await api.get<NotificationResponse>("/notifications?limit=100");
            const received = response.data.data.filter((item) => item.status === "sent" && !item.readAt);
            setNotifications(received);
        } catch (loadError) {
            console.error("Could not load or mark notifications as read", loadError);
            setError("Notifications could not be loaded. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const openNotification = async (notification: NotificationItem) => {
        try {
            if (!notification.readAt) {
                await api.patch(`/notifications/${notification._id}/read`);
                setNotifications((current) => current.filter((item) => item._id !== notification._id));
                setUnread((value) => Math.max(0, value - 1));
            } else {
                setNotifications((current) => current.filter((item) => item._id !== notification._id));
            }
            setIsOpen(false);
            if (notification.url.startsWith("/") && !notification.url.startsWith("//")) {
                router.push(notification.url);
            }
        } catch (markError) {
            console.error("Could not mark notification as read", markError);
            setError("This notification could not be marked as read. Please try again.");
        }
    };

    return (
        <div ref={containerRef} className="relative inline-flex">
            <button
                type="button"
                onClick={() => void toggleNotifications()}
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {isOpen && (
                <section
                    role="dialog"
                    aria-label="Notifications"
                    className="fixed right-4 top-16 z-[60] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 md:right-8 md:top-14"
                >
                    <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                        <div>
                            <h2 className="text-sm font-semibold">Notifications</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Open a notification to mark it as read.</p>
                        </div>
                        {unread === 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                <Check className="h-3.5 w-3.5" />
                                Read
                            </span>
                        )}
                    </header>

                    {error && (
                        <p role="alert" className="px-4 py-3 text-sm text-destructive">{error}</p>
                    )}
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-zinc-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            You&apos;re all caught up.
                        </p>
                    ) : (
                        <ul className="max-h-[min(60vh,24rem)] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                            {notifications.map((notification) => (
                                <li key={notification._id}>
                                    <button
                                        type="button"
                                        onClick={() => void openNotification(notification)}
                                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                                            notification.readAt ? "" : "bg-primary/5"
                                        }`}
                                    >
                                        <span className="flex items-start justify-between gap-3">
                                            <span className="text-sm font-medium">{notification.title}</span>
                                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                                            {notification.body}
                                        </span>
                                        <span className="mt-1.5 block text-[11px] text-zinc-400">
                                            {formatSentAt(notification.sentAt)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </div>
    );
}
