"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface LogInvestedValuesFormProps {
    onSuccess: () => void;
}

const ASSET_CLASSES = [
    { id: "indian_stocks", label: "Indian Stocks", category: "Indian Stocks" },
    { id: "us_stocks", label: "US Stocks", category: "US Stocks" },
    { id: "mutual_funds", label: "Mutual Funds", category: "Mutual Funds" },
    { id: "gold", label: "Gold", category: "Gold" },
    { id: "silver", label: "Silver", category: "Silver" },
    { id: "bonds", label: "Bonds", category: "Bonds" },
    { id: "crypto", label: "Crypto", category: "Crypto" },
];

export function LogInvestedValuesForm({ onSuccess }: LogInvestedValuesFormProps) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleValueChange = (id: string, value: string) => {
        setValues(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty or zero values
        const validEntries = ASSET_CLASSES
            .map(ac => ({
                category: ac.category,
                amount: parseFloat(values[ac.id] || "0")
            }))
            .filter(entry => entry.amount > 0);

        if (validEntries.length === 0) {
            setError("Please enter at least one valid investment amount.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Log as historical transactions for today
            const isoDate = new Date().toISOString();

            const transactionsToCreate = validEntries.map(entry => ({
                type: "investment",
                amount: entry.amount,
                category: entry.category,
                description: `Initial Portfolio Log - ${entry.category}`,
                date: isoDate
            }));

            // Use the portfolio bulk API (separate database)
            await api.post("/portfolio/bulk", transactionsToCreate);

            // Clear form
            setValues({});
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to log investments");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Log Invested Values</CardTitle>
                <CardDescription>
                    Quickly log your current starting balances across different asset classes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-3">
                        {ASSET_CLASSES.map(ac => (
                            <div key={ac.id} className="grid grid-cols-[1fr_120px] sm:grid-cols-[1fr_140px] items-center gap-3">
                                <Label htmlFor={ac.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {ac.label}
                                </Label>
                                <Input
                                    id={ac.id}
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={values[ac.id] || ""}
                                    onChange={(e) => handleValueChange(ac.id, e.target.value)}
                                    className="h-9 text-right font-medium"
                                />
                            </div>
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Investment Portfolio
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
