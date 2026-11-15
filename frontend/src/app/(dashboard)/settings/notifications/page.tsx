"use client";

import { useEffect, useState } from "react";
import {
    Bell, Check, Clock3, Info, Loader2, MessageSquareText, Save, Send,
    ShieldCheck, Smartphone, Sparkles, Trash2,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    disableNotifications, enableNotifications, getCurrentPushSubscription,
    syncGrantedNotifications, syncPushSubscription, type NotificationPreferences,
} from "@/lib/notifications";

type NotificationType = keyof NotificationPreferences["types"];
type MessageDraft = { title?: string; body?: string };
type Device = { endpoint: string; userAgent?: string; deviceLabel?: string; lastSuccessAt?: string };
type PreferencesPatch = Partial<NotificationPreferences> & { types?: Record<string, boolean>; customMessages?: Record<string, MessageDraft> };

const notificationTypes: Array<{ key: NotificationType; label: string; description: string }> = [
    { key: "budgetAlerts", label: "Budget alerts", description: "Know when spending reaches a budget limit." },
    { key: "goalReminders", label: "Goal reminders", description: "Stay on track with upcoming goal deadlines." },
    { key: "recurringAdded", label: "Recurring transactions", description: "Get notified when a recurring item is added." },
    { key: "weeklySummary", label: "Weekly summary", description: "A quick view of your week in money." },
    { key: "monthlySummary", label: "Monthly summary", description: "Review income and expenses each month." },
    { key: "lendingReminders", label: "Lending reminders", description: "Never miss a repayment follow-up." },
    { key: "securityAlerts", label: "Security alerts", description: "Important activity on your account." },
    { key: "dailyReminder", label: "Daily reminder", description: "A gentle nudge to log your expenses." },
];

const defaultMessage = (item: typeof notificationTypes[number]): Required<MessageDraft> => ({
    title: item.label,
    body: item.description,
});

export default function NotificationSettingsPage() {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [status, setStatus] = useState("Loading your notification workspace...");
    const [saving, setSaving] = useState(false);
    const [testSending, setTestSending] = useState(false);
    const [currentDeviceSubscribed, setCurrentDeviceSubscribed] = useState(false);

    const load = async () => {
        try {
            await syncGrantedNotifications();
        } catch {
            // Settings remain available when push is not configured.
        }
        setCurrentDeviceSubscribed(Boolean(await getCurrentPushSubscription()));
        const [preferenceResponse, devicesResponse] = await Promise.all([
            api.get("/notifications/preferences"), api.get("/notifications/subscriptions"),
        ]);
        setPreferences(preferenceResponse.data as NotificationPreferences);
        setDevices(devicesResponse.data as Device[]);
        setStatus("All changes are saved when you choose Save settings.");
    };

    useEffect(() => { void load().catch(() => setStatus("Unable to load notification settings.")); }, []);

    const updateDraft = (patch: PreferencesPatch) => {
        setPreferences((current) => current ? {
            ...current,
            ...patch,
            types: patch.types ? { ...current.types, ...patch.types } : current.types,
            customMessages: patch.customMessages ? { ...current.customMessages, ...patch.customMessages } : current.customMessages,
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
            const enabled = result === "subscribed";
            setStatus(enabled ? "This device is ready for push notifications." : "Notification permission was not enabled.");
            updateDraft({ enabled });
            await savePreferences({ enabled });
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
                        setStatus("Allow browser notifications before sending a test.");
                        return;
                    }
                } else await syncPushSubscription();
                setCurrentDeviceSubscribed(Boolean(await getCurrentPushSubscription()));
            }
            const response = await api.post<{ status: "sent" | "failed" | "skipped" }>("/notifications/test");
            setStatus(response.data.status === "sent" ? "Test notification sent to this device." : "No active push device was found.");
        } catch (error: unknown) {
            const responseStatus = (error as { response?: { status?: number } }).response?.status;
            setStatus(responseStatus === 429 ? "Too many test requests. Please wait a minute." : "Test notification failed.");
        } finally {
            setTestSending(false);
        }
    };

    if (!preferences) return <Loader2 className="h-8 w-8 animate-spin text-primary" />;

    const enabledCount = notificationTypes.filter(({ key }) => preferences.types?.[key] !== false).length;
    return (
        <div className="min-h-full space-y-6 pb-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-6 text-primary-foreground shadow-lg sm:p-8">
                <div className="relative z-10 max-w-2xl">
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary-foreground/80"><Sparkles className="h-4 w-4" /> Notification studio</div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Make every alert feel like yours.</h1>
                    <p className="mt-3 max-w-xl text-sm text-primary-foreground/80 sm:text-base">Choose what reaches you, when it arrives, and the words you want to see.</p>
                </div>
                <Bell className="absolute -bottom-8 -right-4 h-48 w-48 rotate-12 text-white/10 sm:h-64 sm:w-64" />
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery</p><p className="mt-1 text-xl font-semibold">{preferences.enabled ? "Active" : "Paused"}</p></div>
                <div className="rounded-2xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Alert types</p><p className="mt-1 text-xl font-semibold">{enabledCount} of {notificationTypes.length}</p></div>
                <div className="rounded-2xl border bg-card p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Devices</p><p className="mt-1 text-xl font-semibold">{devices.length} connected</p></div>
            </div>

            <Card>
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Delivery control</CardTitle><CardDescription className="mt-1">Pause all push alerts without losing your preferences.</CardDescription></div>
                        <input aria-label="Enable all notifications" type="checkbox" className="mt-1 h-5 w-5 accent-primary" checked={preferences.enabled} onChange={(event) => event.target.checked ? void enable() : void disable()} disabled={saving} />
                    </div>
                </CardHeader>
                <CardContent className="pt-5">
                    <div className={`flex items-center gap-3 rounded-xl p-3 text-sm ${currentDeviceSubscribed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${currentDeviceSubscribed ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                        {currentDeviceSubscribed ? "This browser is connected and ready to receive alerts." : "This browser is not connected yet. Turn on delivery to add it."}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-primary" /> Alert library</CardTitle><CardDescription>Customize the title and message for every alert. Use {"{{title}}"} or {"{{body}}"} to keep the app&apos;s live details.</CardDescription></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {notificationTypes.map((item) => {
                        const message = preferences.customMessages?.[item.key] || {};
                        const fallback = defaultMessage(item);
                        return (
                            <div key={item.key} className="rounded-2xl border bg-muted/20 p-4">
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div><p className="font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></div>
                                    <input aria-label={`Enable ${item.label}`} type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={preferences.types?.[item.key] !== false} onChange={(event) => updateDraft({ types: { [item.key]: event.target.checked } })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-medium text-muted-foreground">Notification title<input className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder={fallback.title} value={message.title || ""} onChange={(event) => updateDraft({ customMessages: { [item.key]: { ...message, title: event.target.value } } })} /></label>
                                    <label className="block text-xs font-medium text-muted-foreground">Message<textarea className="mt-1 block min-h-16 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm" placeholder={fallback.body} value={message.body || ""} onChange={(event) => updateDraft({ customMessages: { [item.key]: { ...message, body: event.target.value } } })} /></label>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /> Timing &amp; schedules</CardTitle><CardDescription>Control quiet hours and summary timing.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-center justify-between rounded-xl border p-3 text-sm"><span><span className="block font-medium">Quiet hours</span><span className="text-xs text-muted-foreground">Urgent security alerts can still arrive.</span></span><input type="checkbox" className="h-4 w-4 accent-primary" checked={preferences.quietHours?.enabled} onChange={(event) => updateDraft({ quietHours: { ...preferences.quietHours, enabled: event.target.checked } })} /></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="text-xs font-medium text-muted-foreground">Quiet from<input className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm" type="time" value={preferences.quietHours?.start || "22:00"} onChange={(event) => updateDraft({ quietHours: { ...preferences.quietHours, start: event.target.value } })} /></label>
                            <label className="text-xs font-medium text-muted-foreground">Quiet until<input className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm" type="time" value={preferences.quietHours?.end || "08:00"} onChange={(event) => updateDraft({ quietHours: { ...preferences.quietHours, end: event.target.value } })} /></label>
                        </div>
                        <label className="block text-xs font-medium text-muted-foreground">Timezone<input className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm" value={preferences.timezone} onChange={(event) => updateDraft({ timezone: event.target.value })} /></label>
                        <label className="block text-xs font-medium text-muted-foreground">Daily reminder time<input className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm" type="time" value={preferences.dailyReminderTime} onChange={(event) => updateDraft({ dailyReminderTime: event.target.value })} /></label>
                        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground"><Info className="mr-1 inline h-3.5 w-3.5" />Weekly summaries arrive Sunday evening; monthly summaries arrive on the first day of the month.</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Devices &amp; privacy</CardTitle><CardDescription>See where alerts can arrive and protect sensitive amounts.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-center justify-between rounded-xl border p-3 text-sm"><span><span className="block font-medium">Hide amounts on lock screen</span><span className="text-xs text-muted-foreground">Keep financial details private in previews.</span></span><input type="checkbox" className="h-4 w-4 accent-primary" checked={preferences.hideAmounts} onChange={(event) => updateDraft({ hideAmounts: event.target.checked })} /></label>
                        <div className="space-y-2">{devices.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No subscribed devices yet.</p> : devices.map((device) => <div key={device.endpoint} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{device.deviceLabel || device.userAgent || "Browser"}</span><span className="text-xs text-muted-foreground">{device.lastSuccessAt ? "Active" : "Pending"}</span></span><Button variant="ghost" size="icon" onClick={() => api.post("/notifications/unsubscribe", { endpoint: device.endpoint }).then(load)} aria-label="Remove device"><Trash2 className="h-4 w-4" /></Button></div>)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-emerald-500" /> {status}</p>
                <div className="flex gap-2"><Button variant="outline" onClick={() => void sendTest()} disabled={testSending}><Send className="mr-2 h-4 w-4" />{testSending ? "Sending..." : "Send test"}</Button><Button onClick={() => void savePreferences()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save settings"}</Button></div>
            </div>
        </div>
    );
}
