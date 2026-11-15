"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { disableNotifications, enableNotifications, getCurrentPushSubscription, syncGrantedNotifications, syncPushSubscription, type NotificationPreferences } from "@/lib/notifications";

const typeLabels: Record<string, string> = {
    budgetAlerts: "Budget alerts", goalReminders: "Goal reminders", recurringAdded: "Recurring transactions",
    weeklySummary: "Weekly summary", monthlySummary: "Monthly summary", lendingReminders: "Lending reminders",
    securityAlerts: "Security alerts", dailyReminder: "Daily reminder",
};
type Device = { endpoint: string; userAgent?: string; deviceLabel?: string; lastSuccessAt?: string };
type PreferencesPatch = Partial<NotificationPreferences> & { types?: Record<string, boolean> };

export default function NotificationSettingsPage() {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [status, setStatus] = useState("Loading...");
    const [saving, setSaving] = useState(false);
    const [testSending, setTestSending] = useState(false);
    const [currentDeviceSubscribed, setCurrentDeviceSubscribed] = useState(false);

    const load = async () => {
        try {
            await syncGrantedNotifications();
        } catch {
            // The settings page still loads so it can explain missing server configuration.
        }
        setCurrentDeviceSubscribed(Boolean(await getCurrentPushSubscription()));
        const [preferenceResponse, devicesResponse] = await Promise.all([
            api.get("/notifications/preferences"), api.get("/notifications/subscriptions"),
        ]);
        setPreferences(preferenceResponse.data as NotificationPreferences);
        setDevices(devicesResponse.data as Device[]);
        setStatus("Ready");
    };

    useEffect(() => { void load().catch(() => setStatus("Unable to load notification settings.")); }, []);

    const updateDraft = (patch: PreferencesPatch) => {
        setPreferences((current) => current ? {
            ...current,
            ...patch,
            types: patch.types ? { ...current.types, ...patch.types } : current.types,
        } : current);
    };

    const savePreferences = async (patch: PreferencesPatch = preferences ?? {}) => {
        setSaving(true);
        try {
            const response = await api.patch("/notifications/preferences", patch);
            setPreferences(response.data as NotificationPreferences);
            setStatus("Notification settings saved.");
        } catch {
            setStatus("Could not save notification settings.");
        } finally {
            setSaving(false);
        }
    };

    const enable = async () => {
        setStatus("Requesting permission...");
        try {
            const result = await enableNotifications();
            setCurrentDeviceSubscribed(result === "subscribed");
            setStatus(result === "unsupported" ? "This browser does not support Web Push." : result === "denied" ? "Permission denied. Re-enable notifications in your browser site settings." : result === "cancelled" ? "Permission request cancelled." : "Subscribed to notifications.");
            updateDraft({ enabled: result === "subscribed" });
            await savePreferences({ enabled: result === "subscribed" });
            await load();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Could not enable notifications.");
        }
    };

    const disable = async () => {
        try {
            await disableNotifications();
            setCurrentDeviceSubscribed(false);
            updateDraft({ enabled: false });
            await savePreferences({ enabled: false });
            setStatus("Notifications disabled.");
            await load();
        } catch {
            setStatus("Could not disable notifications.");
        }
    };

    const sendTest = async () => {
        setTestSending(true);
        try {
            if (!await getCurrentPushSubscription()) {
                if (Notification.permission !== "granted") {
                    const result = await enableNotifications();
                    if (result !== "subscribed") {
                        setStatus(result === "denied" ? "Allow browser notifications before sending a test." : "Enable notifications on this device before sending a test.");
                        return;
                    }
                } else {
                    await syncPushSubscription();
                }
                setCurrentDeviceSubscribed(Boolean(await getCurrentPushSubscription()));
            }
            const response = await api.post<{ status: "sent" | "failed" | "skipped" }>("/notifications/test");
            setStatus(response.data.status === "sent" ? "Test notification sent." : response.data.status === "skipped" ? "No active subscribed device was found. Enable notifications on this device first." : "Test notification failed.");
        } catch (error: unknown) {
            const responseStatus = (error as { response?: { status?: number } }).response?.status;
            setStatus(responseStatus === 429 ? "Too many test requests. Please wait a minute and try again." : "Test notification failed.");
        } finally {
            setTestSending(false);
        }
    };

    if (!preferences) return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-bold tracking-tight">Notifications</h1><p className="mt-1 text-zinc-500">Push alerts and in-app notification history.</p></div>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification settings</CardTitle><CardDescription>{status}</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                    <p className="rounded-lg border border-dashed p-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {currentDeviceSubscribed ? "This browser is subscribed to push notifications." : "This browser is not subscribed yet. Enable notifications here to add this device."}
                    </p>
                    <label className="flex items-center justify-between gap-4"><span className="font-medium">Enable notifications</span><input type="checkbox" checked={preferences.enabled} onChange={(event) => event.target.checked ? enable() : disable()} disabled={saving} /></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(typeLabels).map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-lg border p-3"><span>{label}</span><input type="checkbox" checked={preferences.types?.[key] !== false} onChange={(event) => updateDraft({ types: { [key]: event.target.checked } })} /></label>)}
                    </div>
                    <label className="flex items-center justify-between gap-4"><span>Hide amounts on lock screen</span><input type="checkbox" checked={preferences.hideAmounts} onChange={(event) => updateDraft({ hideAmounts: event.target.checked })} /></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-sm">Daily reminder time<input className="block rounded-md border bg-background p-2" type="time" value={preferences.dailyReminderTime} onChange={(event) => updateDraft({ dailyReminderTime: event.target.value })} /></label>
                        <label className="space-y-1 text-sm">Timezone<input className="block w-full rounded-md border bg-background p-2" value={preferences.timezone} onChange={(event) => updateDraft({ timezone: event.target.value })} /></label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => void savePreferences()} disabled={saving}>Save notification settings</Button>
                        <Button variant="outline" onClick={() => void sendTest()} disabled={testSending}>{testSending ? "Sending..." : "Send test notification"}</Button>
                    </div>
                </CardContent>
            </Card>
            <Card><CardHeader><CardTitle>Subscribed devices</CardTitle></CardHeader><CardContent className="space-y-2">{devices.length === 0 ? <p className="text-sm text-zinc-500">No subscribed devices.</p> : devices.map((device) => <div key={device.endpoint} className="flex items-center justify-between rounded border p-3 text-sm"><span>{device.deviceLabel || device.userAgent || "Browser"}<br /><small className="text-zinc-500">{device.lastSuccessAt ? "Active" : "Pending"}</small></span><Button variant="ghost" size="icon" onClick={() => api.post("/notifications/unsubscribe", { endpoint: device.endpoint }).then(load)} aria-label="Remove device"><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>
        </div>
    );
}
