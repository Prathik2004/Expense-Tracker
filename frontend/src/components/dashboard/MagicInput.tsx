"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight } from "lucide-react";
import { parseMagicInput } from "@/lib/magicParser";

interface MagicInputProps {
    onMagicAdd: (data: { amount: number; category: string; description: string }) => void;
    categories: string[];
}

export function MagicInput({ onMagicAdd, categories }: MagicInputProps) {
    const [value, setValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        const parsed = parseMagicInput(value, categories);
        onMagicAdd(parsed);
        setValue(""); // Clear after submitting
    };

    return (
        <div className="relative group max-w-2xl mx-auto w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
            <form onSubmit={handleSubmit} className="relative flex items-center">
                <div className="absolute left-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <Input
                    className="h-16 pl-12 pr-16 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl text-lg shadow-xl focus-visible:ring-1 focus-visible:ring-blue-500/50 placeholder:text-zinc-400"
                    placeholder="Try: '150 food coffee' or 'lunch 200'"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button
                    type="submit"
                    className="absolute right-3 p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                    disabled={!value.trim()}
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </form>
            <p className="mt-2 text-[11px] text-zinc-400 text-center font-medium uppercase tracking-wider">
                Magic Input: Amount · Category · Description
            </p>
        </div>
    );
}
