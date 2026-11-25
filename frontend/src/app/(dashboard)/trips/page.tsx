"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    CalendarDays,
    Check,
    CircleAlert,
    Loader2,
    Plane,
    Plus,
    ReceiptText,
    Trash2,
    TrendingUp,
    Wallet,
} from "lucide-react";

interface TripExpense {
    id: string;
    description: string;
    amount: number;
    account: string;
    date: string;
}

interface DraftExpense {
    id: string;
    description: string;
    amount: string;
    account: string;
}

interface TripWorkspace {
    id: string;
    name: string;
    expenses: TripExpense[];
}

interface ApiTrip {
    _id: string;
    name: string;
    expenses: Array<{
        _id: string;
        description: string;
        amount: number;
        account: string;
        date: string;
    }>;
}

const STORAGE_KEY_PREFIX = "trip-expense-log";
const MIGRATION_KEY_PREFIX = "trip-expenses-migrated";
const TRIP_EXPENSES_API = "/trip-expenses/trips";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function stripWrappingBrackets(value: string) {
    const brackets = [["(", ")"], ["[", "]"], ["{", "}"]] as const;
    let result = value.trim();
    let previous = "";

    while (result !== previous) {
        previous = result;
        const pair = brackets.find(([open, close]) => result.startsWith(open) && result.endsWith(close));
        if (pair) result = result.slice(pair[0].length, -pair[1].length).trim();
    }

    return result;
}

function cleanExpenseDescription(value: string) {
    return stripWrappingBrackets(value.trim().replace(/[-–—:;]+\s*$/, ""));
}

function parseExpenseLines(text: string, defaultAccount: string) {
    const expenses: DraftExpense[] = [];
    const invalidLines: string[] = [];

    text.split(/\r?\n/).forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) return;

        const match = line.match(/^(.*)(?:\s*[-–—:;]\s*|\s+)(?:₹\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\s*(?:[-–—:;]\s*)?(.*))?$/i);
        const description = match ? cleanExpenseDescription(match[1]) : "";
        const amount = match ? Number(match[2].replace(/,/g, "")) : NaN;
        const accountText = (match?.[3] ?? "")
            .trim()
            .replace(/^INR(?:\s+|$)/i, "")
            .replace(/^[-–—:;]\s*/, "")
            .trim();
        const pastedAccount = stripWrappingBrackets(accountText);

        if (!description || !Number.isFinite(amount) || amount <= 0) {
            invalidLines.push(line);
            return;
        }

        expenses.push({
            id: createId(),
            description,
            amount: String(amount),
            account: pastedAccount || defaultAccount.trim() || "Cash",
        });
    });

    return { expenses, invalidLines };
}

function getToday() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function normalizeTrip(trip: ApiTrip): TripWorkspace {
    return {
        id: trip._id,
        name: trip.name,
        expenses: (trip.expenses ?? []).map((expense) => ({
            id: expense._id,
            description: cleanExpenseDescription(expense.description),
            amount: Number(expense.amount),
            account: expense.account,
            date: expense.date.slice(0, 10),
        })),
    };
}

export default function TripExpensesPage() {
    const user = useAuthStore((state) => state.user);
    const userId = user?._id ?? user?.id ?? "local";
    const legacyStorageKey = `${STORAGE_KEY_PREFIX}:${userId}`;
    const migrationStorageKey = `${MIGRATION_KEY_PREFIX}:${userId}`;

    const [trips, setTrips] = useState<TripWorkspace[]>([]);
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [defaultAccount, setDefaultAccount] = useState("Cash");
    const [bulkText, setBulkText] = useState("");
    const [draftExpenses, setDraftExpenses] = useState<DraftExpense[]>([]);
    const [invalidLines, setInvalidLines] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(getToday);
    const [bulkDate, setBulkDate] = useState(getToday);
    const [requestError, setRequestError] = useState("");
    const [draftError, setDraftError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingTrip, setIsCreatingTrip] = useState(false);
    const [newTripName, setNewTripName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const activeTrip = useMemo(
        () => trips.find((trip) => trip.id === activeTripId) ?? null,
        [activeTripId, trips],
    );
    const expenses = useMemo(() => activeTrip?.expenses ?? [], [activeTrip]);

    const loadTrips = useCallback(async () => {
        setIsLoading(true);
        setRequestError("");
        try {
            let response = await api.get<ApiTrip[]>(TRIP_EXPENSES_API);
            if (!localStorage.getItem(migrationStorageKey)) {
                const legacyStored = localStorage.getItem(legacyStorageKey);
                if (legacyStored) {
                    try {
                        const legacy = JSON.parse(legacyStored) as {
                            tripName?: string;
                            expenses?: TripExpense[];
                        };
                        if (!legacy || !Array.isArray(legacy.expenses)) {
                            throw new Error("Legacy trip data has an unexpected format.");
                        }

                        await api.post(`${TRIP_EXPENSES_API}/migrate-local`, {
                            name: typeof legacy.tripName === "string" && legacy.tripName.trim()
                                ? legacy.tripName.trim()
                                : "My trip",
                            expenses: legacy.expenses.map((expense) => ({
                                description: expense.description,
                                amount: Number(expense.amount),
                                account: expense.account,
                                date: new Date(expense.date).toISOString(),
                            })),
                        });
                        localStorage.removeItem(legacyStorageKey);
                        localStorage.setItem(migrationStorageKey, "true");
                        response = await api.get<ApiTrip[]>(TRIP_EXPENSES_API);
                    } catch (error) {
                        console.error("Could not migrate local trip expenses", error);
                        setRequestError("Your previous trip expenses could not be moved to the database. They remain saved in this browser; please retry.");
                    }
                } else {
                    localStorage.setItem(migrationStorageKey, "true");
                }
            }

            const loadedTrips = response.data.map(normalizeTrip);
            setTrips(loadedTrips);
            setActiveTripId((current) =>
                loadedTrips.some((trip) => trip.id === current)
                    ? current
                    : loadedTrips[0]?.id ?? null,
            );
        } catch (error) {
            console.error("Could not load trip expenses", error);
            setRequestError("Could not load trips from the database. Check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [legacyStorageKey, migrationStorageKey]);

    useEffect(() => {
        void loadTrips();
    }, [loadTrips]);

    const total = useMemo(
        () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
        [expenses],
    );

    const accountTotals = useMemo(() => {
        const totals = new Map<string, number>();
        expenses.forEach((expense) => {
            totals.set(expense.account, (totals.get(expense.account) ?? 0) + expense.amount);
        });
        return Array.from(totals.entries()).sort((first, second) => second[1] - first[1]);
    }, [expenses]);

    const largestExpense = useMemo(
        () => expenses.reduce<TripExpense | null>(
            (largest, expense) => !largest || expense.amount > largest.amount ? expense : largest,
            null,
        ),
        [expenses],
    );

    const handleTripChange = (tripId: string) => {
        setActiveTripId(tripId);
        setBulkText("");
        setDraftExpenses([]);
        setInvalidLines([]);
        setDraftError("");
        setDescription("");
        setAmount("");
        setDefaultAccount("Cash");
        setDate(getToday());
        setBulkDate(getToday());
    };

    const handleCreateTrip = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = newTripName.trim();
        if (!name) return;

        setIsSaving(true);
        setRequestError("");
        try {
            const response = await api.post<ApiTrip>(TRIP_EXPENSES_API, { name });
            const trip = normalizeTrip(response.data);
            setTrips((current) => [...current, trip]);
            handleTripChange(trip.id);
            setNewTripName("");
            setIsCreatingTrip(false);
        } catch (error) {
            console.error("Could not create trip", error);
            setRequestError("Could not create this trip. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleParse = () => {
        const parsed = parseExpenseLines(bulkText, defaultAccount);
        setDraftExpenses(parsed.expenses);
        setInvalidLines(parsed.invalidLines);
        setDraftError("");
    };

    const handleSaveBulk = () => {
        if (!activeTrip) return;
        if (invalidLines.length > 0) {
            setDraftError("Fix or remove the unrecognized lines in the text box, then detect them again.");
            return;
        }

        const validExpenses = draftExpenses.map((expense) => ({
            ...expense,
            description: expense.description.trim(),
            account: expense.account.trim(),
            amount: Number(expense.amount),
        }));

        if (validExpenses.length === 0) return;
        if (validExpenses.some((expense) => (
            !expense.description || !expense.account ||
            !Number.isFinite(expense.amount) || expense.amount <= 0
        ))) {
            setDraftError("Each row needs a description, a positive amount, and an account.");
            return;
        }
        setIsSaving(true);
        setDraftError("");
        api.post<ApiTrip>(`${TRIP_EXPENSES_API}/${activeTrip.id}/expenses/bulk`, {
            expenses: validExpenses.map((expense) => ({ ...expense, date: bulkDate })),
        }).then((response) => {
            const updatedTrip = normalizeTrip(response.data);
            setTrips((current) => current.map((trip) => trip.id === updatedTrip.id ? updatedTrip : trip));
            setBulkText("");
            setDraftExpenses([]);
            setInvalidLines([]);
        }).catch((error) => {
            console.error("Could not save trip expenses", error);
            setDraftError("These expenses could not be saved to the database. Please try again.");
        }).finally(() => setIsSaving(false));
    };

    const handleAddExpense = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeTrip) return;
        const parsedAmount = Number(amount.replace(/,/g, ""));
        if (!description.trim() || !defaultAccount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return;
        }

        setIsSaving(true);
        setRequestError("");
        try {
            const response = await api.post<ApiTrip>(`${TRIP_EXPENSES_API}/${activeTrip.id}/expenses`, {
                description: description.trim(),
                amount: parsedAmount,
                account: defaultAccount.trim(),
                date,
            });
            const updatedTrip = normalizeTrip(response.data);
            setTrips((current) => current.map((trip) => trip.id === updatedTrip.id ? updatedTrip : trip));
            setDescription("");
            setAmount("");
        } catch (error) {
            console.error("Could not save trip expense", error);
            setRequestError("This expense could not be saved to the database. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateDraft = (id: string, field: keyof DraftExpense, value: string) => {
        setDraftExpenses((current) =>
            current.map((expense) => expense.id === id ? { ...expense, [field]: value } : expense),
        );
        setDraftError("");
    };

    const removeExpense = async (id: string) => {
        if (!activeTrip) return;
        setRequestError("");
        try {
            await api.delete(`${TRIP_EXPENSES_API}/${activeTrip.id}/expenses/${id}`);
            setTrips((current) => current.map((trip) => trip.id === activeTrip.id
                ? { ...trip, expenses: trip.expenses.filter((expense) => expense.id !== id) }
                : trip));
        } catch (error) {
            console.error("Could not delete trip expense", error);
            setRequestError("This expense could not be deleted. Please try again.");
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-7 pb-8">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                        <Plane className="h-3.5 w-3.5" />
                        YOUR TRAVEL LEDGER
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Trip expenses</h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Keep every ride, meal, and stay together. Add one expense or paste a whole list.
                    </p>
                </div>
                <div className="w-full space-y-2 sm:max-w-md">
                    <label htmlFor="trip-selector" className="block text-xs font-medium text-zinc-500">
                        Your separate trip spaces
                    </label>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <select
                            id="trip-selector"
                            value={activeTripId ?? ""}
                            onChange={(event) => handleTripChange(event.target.value)}
                            disabled={isLoading || trips.length === 0}
                            className="h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:bg-zinc-900"
                        >
                            {trips.length === 0 && <option value="">No trips yet</option>}
                            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
                        </select>
                        <Button
                            type="button"
                            className="h-10"
                            onClick={() => setIsCreatingTrip((current) => !current)}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            New trip
                        </Button>
                    </div>
                    {isCreatingTrip && (
                        <form onSubmit={handleCreateTrip} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                            <Input
                                aria-label="New trip name"
                                value={newTripName}
                                onChange={(event) => setNewTripName(event.target.value)}
                                placeholder="e.g. Goa weekend"
                                maxLength={100}
                                className="h-10"
                                autoFocus
                                required
                            />
                            <Button type="submit" className="h-10" disabled={isSaving || !newTripName.trim()}>
                                Create
                            </Button>
                        </form>
                    )}
                </div>
            </header>

            {requestError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="flex-1">{requestError}</span>
                    {!isLoading && (
                        <Button type="button" variant="outline" size="sm" onClick={() => void loadTrips()}>
                            Retry
                        </Button>
                    )}
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading your trips...
                </div>
            )}

            {!isLoading && !activeTrip && (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                    <Plane className="mx-auto mb-3 h-7 w-7 text-sky-600 dark:text-sky-300" />
                    <h2 className="font-semibold">Create a trip to start logging</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Each trip has its own expense list and total. Use “New trip” above to create your first space.
                    </p>
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-zinc-900 p-5 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300 dark:text-zinc-600">Total trip cost</span>
                        <span className="rounded-lg bg-white/10 p-2 dark:bg-zinc-900/10">
                            <ReceiptText className="h-4 w-4" />
                        </span>
                    </div>
                    <p className="mt-5 text-3xl font-bold tracking-tight">{formatCurrency(total)}</p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Across {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                        <span className="text-sm">Accounts used</span>
                        <Wallet className="h-4 w-4" />
                    </div>
                    <p className="mt-5 text-3xl font-bold tracking-tight">{accountTotals.length}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Payment sources for this trip</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                        <span className="text-sm">Largest expense</span>
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <p className="mt-5 text-3xl font-bold tracking-tight">
                        {formatCurrency(largestExpense?.amount ?? 0)}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400" title={largestExpense?.description}>
                        {largestExpense?.description ?? "No expenses recorded"}
                    </p>
                </div>
            </section>

            <section className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-semibold">Add expenses in bulk</h2>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                One per line: description, amount, and optional account. Separators are flexible.
                            </p>
                        </div>
                        <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-700 dark:text-sky-300">
                            <ReceiptText className="h-5 w-5" />
                        </div>
                    </div>

                    <Textarea
                        value={bulkText}
                        onChange={(event) => setBulkText(event.target.value)}
                        placeholder={"bus - 1000 - credit card\nauto 150 cash\npetrol - 200\nstay - 800"}
                        aria-label="Paste trip expenses, one per line"
                        disabled={!activeTrip}
                        className="min-h-36 resize-y font-mono text-sm leading-6 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="min-w-0">
                            <label htmlFor="bulk-account" className="mb-1.5 block text-xs font-medium text-zinc-500">
                                Default account for these expenses
                            </label>
                            <Input
                                id="bulk-account"
                                value={defaultAccount}
                                onChange={(event) => setDefaultAccount(event.target.value)}
                                placeholder="Cash, debit card, etc."
                                disabled={!activeTrip}
                                className="h-10"
                            />
                        </div>
                        <div className="min-w-0">
                            <label htmlFor="bulk-date" className="mb-1.5 block text-xs font-medium text-zinc-500">
                                Date for this batch
                            </label>
                            <Input
                                id="bulk-date"
                                type="date"
                                value={bulkDate}
                                onChange={(event) => setBulkDate(event.target.value)}
                                disabled={!activeTrip}
                                className="h-10"
                            />
                        </div>
                    </div>
                    <Button
                        type="button"
                        className="mt-3 h-10 w-full"
                        onClick={handleParse}
                        disabled={!activeTrip || !bulkText.trim()}
                    >
                            <Check className="mr-2 h-4 w-4" />
                            Detect expenses
                    </Button>

                    {(draftExpenses.length > 0 || invalidLines.length > 0) && (
                        <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold">Review detected expenses</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {draftExpenses.length} ready to add{invalidLines.length ? ` · ${invalidLines.length} need attention` : ""}
                                    </p>
                                </div>
                                {draftExpenses.length > 0 && (
                                    <Button type="button" size="sm" onClick={handleSaveBulk} disabled={isSaving}>
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Add {draftExpenses.length}
                                    </Button>
                                )}
                            </div>

                            <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] gap-2 px-3 text-xs font-medium text-zinc-500 sm:grid">
                                <span>Description</span>
                                <span>Amount (₹)</span>
                                <span>Account</span>
                            </div>
                            <div className="space-y-2">
                                {draftExpenses.map((expense) => (
                                    <div key={expense.id} className="grid gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950 sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] sm:items-end sm:gap-2">
                                        <div className="min-w-0">
                                            <label className="mb-1 block text-xs font-medium text-zinc-500 sm:hidden">Description</label>
                                            <Input
                                                aria-label="Expense description"
                                                value={expense.description}
                                                onChange={(event) => updateDraft(expense.id, "description", event.target.value)}
                                                className="h-10 bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <label className="mb-1 block text-xs font-medium text-zinc-500 sm:hidden">Amount (₹)</label>
                                            <Input
                                                aria-label="Expense amount"
                                                inputMode="decimal"
                                                value={expense.amount}
                                                onChange={(event) => updateDraft(expense.id, "amount", event.target.value)}
                                                className="h-10 bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <label className="mb-1 block text-xs font-medium text-zinc-500 sm:hidden">Account</label>
                                            <Input
                                                aria-label="Account used for expense"
                                                value={expense.account}
                                                onChange={(event) => updateDraft(expense.id, "account", event.target.value)}
                                                className="h-10 bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {invalidLines.length > 0 && (
                                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                                    <p className="mb-1 font-semibold">Couldn&apos;t detect an amount on these lines:</p>
                                    <p>{invalidLines.join(" · ")}</p>
                                    <p className="mt-1 opacity-80">Try a description followed by an amount, such as <code>lunch 250</code>.</p>
                                </div>
                            )}
                            {draftError && (
                                <p role="alert" className="mt-3 text-xs font-medium text-destructive">{draftError}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-semibold">Add one expense</h2>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Log a single payment.</p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300">
                            <Plus className="h-5 w-5" />
                        </div>
                    </div>

                    <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                            <label htmlFor="expense-description" className="mb-1.5 block text-xs font-medium text-zinc-500">What did you spend on?</label>
                            <Input
                                id="expense-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="e.g. Airport taxi"
                                disabled={!activeTrip}
                                className="h-10"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="expense-amount" className="mb-1.5 block text-xs font-medium text-zinc-500">Amount (₹)</label>
                                <Input
                                    id="expense-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="0.00"
                                    disabled={!activeTrip}
                                    className="h-10"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="expense-date" className="mb-1.5 block text-xs font-medium text-zinc-500">Date</label>
                                <Input
                                    id="expense-date"
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    disabled={!activeTrip}
                                    className="h-10"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="single-account" className="mb-1.5 block text-xs font-medium text-zinc-500">Paid from account</label>
                            <Input
                                id="single-account"
                                value={defaultAccount}
                                onChange={(event) => setDefaultAccount(event.target.value)}
                                placeholder="Cash, debit card, etc."
                                disabled={!activeTrip}
                                className="h-10"
                                required
                            />
                        </div>
                        <Button type="submit" className="h-10 w-full" disabled={!activeTrip || isSaving}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add expense
                        </Button>
                    </form>

                    {accountTotals.length > 0 && (
                        <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Spend by account</h3>
                            <div className="space-y-3">
                                {accountTotals.map(([account, accountTotal]) => (
                                    <div key={account} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                            <Wallet className="h-4 w-4 shrink-0 text-zinc-400" />
                                            <span className="truncate">{account}</span>
                                        </span>
                                        <span className="font-semibold tabular-nums">{formatCurrency(accountTotal)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
                    <div>
                        <h2 className="font-semibold">Expense list</h2>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {activeTrip?.name ?? "Your trip"} · {expenses.length} {expenses.length === 1 ? "item" : "items"}
                        </p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-zinc-400" />
                </div>
                {expenses.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-12 text-center">
                        <div className="mb-3 rounded-2xl bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                            <Plane className="h-6 w-6" />
                        </div>
                        <p className="font-medium">No expenses yet</p>
                        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                            Paste your trip costs above or add an expense to start tracking your total.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {expenses.map((expense) => (
                            <li key={expense.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    <ReceiptText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{expense.description}</p>
                                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                        {expense.account} · {new Date(`${expense.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                                <p className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatCurrency(expense.amount)}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${expense.description}`}
                                    onClick={() => removeExpense(expense.id)}
                                    className="h-9 w-9 shrink-0 text-zinc-400 hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
