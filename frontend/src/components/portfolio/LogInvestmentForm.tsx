"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, PlusCircle } from "lucide-react";

interface LogInvestmentFormProps {
    onSuccess: () => void;
}

const INVESTMENT_CATEGORIES = [
    "Indian Stocks",
    "US Stocks",
    "Mutual Funds",
    "Liquid Fund",
    "Gold",
    "Silver",
    "Bonds",
    "Crypto",
    "Other"
];

const INVESTMENT_ACTIONS = [
    { value: "buy", label: "Buy / SIP" },
    { value: "sell", label: "Sell" },
    { value: "dividend", label: "Dividend" },
    { value: "fee", label: "Fee" },
    { value: "transfer", label: "Transfer" },
    { value: "other", label: "Other" },
];

export function LogInvestmentForm({ onSuccess }: LogInvestmentFormProps) {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [investmentAction, setInvestmentAction] = useState("buy");
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category || !date) {
            setError("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await api.post("/transactions", {
                type: "investment",
                amount: parseFloat(amount),
                category,
                description,
                date: new Date(date).toISOString(),
                investmentAction,
                symbol: symbol || undefined,
                quantity: quantity ? parseFloat(quantity) : undefined,
                price: price ? parseFloat(price) : undefined,
                source: "manual",
            });

            // Reset form on success
            setAmount("");
            setCategory("");
            setDescription("");
            setInvestmentAction("buy");
            setSymbol("");
            setQuantity("");
            setPrice("");
            onSuccess();
        } catch (err: unknown) {
            const message = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setError(message || "Failed to log investment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Log Investment
                </CardTitle>
                <CardDescription>
                    Add historical or new investment records
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="inv-amount">Amount (₹)</Label>
                        <Input
                            id="inv-amount"
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="font-medium"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="inv-category">Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as string)} required>
                                <SelectTrigger id="inv-category">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INVESTMENT_CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inv-date">Date</Label>
                            <Input
                                id="inv-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="inv-action">Action</Label>
                            <Select value={investmentAction} onValueChange={(value) => value && setInvestmentAction(value)}>
                                <SelectTrigger id="inv-action"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {INVESTMENT_ACTIONS.map(action => <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inv-symbol">Symbol / ISIN</Label>
                            <Input id="inv-symbol" placeholder="e.g. INFY" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="inv-quantity">Quantity</Label>
                            <Input id="inv-quantity" type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inv-price">Price per unit</Label>
                            <Input id="inv-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="inv-description">Description (Optional)</Label>
                        <Input
                            id="inv-description"
                            placeholder="e.g. SIP, 10 shares of AAPL"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Investment
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
