import api from "@/lib/api";

export type NotificationPreferences = {
    enabled: boolean;
    types: Record<string, boolean>;
    quietHours: { enabled: boolean; start: string; end: string };
    timezone: string;
    dailyReminderTime: string;
    hideAmounts: boolean;
};

const isSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!isSupported()) return null;
    return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function urlBase64ToUint8Array(value: string): ArrayBuffer {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0))).buffer as ArrayBuffer;
}

export async function syncPushSubscription(): Promise<PushSubscription | null> {
    const registration = await registerNotificationServiceWorker();
    if (!registration) return null;
    const keyResponse = await api.get<{ publicKey: string | null }>("/notifications/vapid-public-key");
    if (!keyResponse.data.publicKey) throw new Error("Push notifications are not configured on the server.");
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyResponse.data.publicKey),
    });
    await api.post("/notifications/subscribe", subscription.toJSON());
    return subscription;
}

export async function enableNotifications(): Promise<"subscribed" | "denied" | "unsupported" | "cancelled"> {
    if (!isSupported()) return "unsupported";
    if (Notification.permission === "denied") return "denied";
    if (Notification.permission === "default" && !window.confirm("Expensify uses notifications for budgets, reminders, and security alerts. Allow notifications?")) return "cancelled";
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") return "denied";
    await syncPushSubscription();
    return "subscribed";
}

export async function unsubscribeNotifications(): Promise<void> {
    if (!isSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await api.post("/notifications/unsubscribe", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
}

export async function disableNotifications(): Promise<void> {
    if (!isSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
        await api.post("/notifications/unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
    }
}

export async function syncGrantedNotifications(): Promise<void> {
    if (isSupported() && Notification.permission === "granted") await syncPushSubscription();
}
