"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth.store";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    ListOrdered,
    PieChart,
    Target,
    Wallet,
    FileText,
    Moon,
    Sun,
    LogOut,
    PlusCircle,
    Search
} from "lucide-react";
import { sounds } from "@/lib/sounds";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { logout } = useAuthStore();

    useEffect(() => {
        setIsMounted(true);
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => {
                    if (!open) sounds.playTick();
                    return !open;
                });
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        setInputValue("");
        command();
    };

    // Flexible regex for "Add [Amount] [preposition?] [Description]"
    // Matches: "Add 500 Food", "Add 500 for Food", "Add 500 to Rent", etc.
    const addExpenseMatch = inputValue.match(/^add\s+(?:rs\.?|₹)?\s*(\d+)(?:\s+(?:for|to|on))?\s+(.*)/i);
    const isAddExpenseCommand = !!addExpenseMatch;

    // Search command should show if there's input and it's not a clear add command
    const isSearchCommand = inputValue.trim().length > 0;

    if (!isMounted) {
        return null;
    }

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Type a command or search..."
                value={inputValue}
                onValueChange={setInputValue}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                {isAddExpenseCommand && addExpenseMatch && (
                    <CommandGroup heading="Smart Actions">
                        <CommandItem
                            value={`add ${addExpenseMatch[1]} ${addExpenseMatch[2]}`}
                            onSelect={() => runCommand(() => {
                                const amount = addExpenseMatch[1];
                                const description = addExpenseMatch[2];
                                window.dispatchEvent(new CustomEvent('open_smart_add_transaction', {
                                    detail: {
                                        amount: Number(amount),
                                        description: description.trim(),
                                        type: 'expense'
                                    }
                                }));
                            })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                            <span>Log Expense: ₹{addExpenseMatch[1]} for &quot;{addExpenseMatch[2]}&quot;</span>
                        </CommandItem>
                    </CommandGroup>
                )}

                {isSearchCommand && (
                    <CommandGroup heading="Search">
                        <CommandItem
                            value={inputValue}
                            onSelect={() => runCommand(() => router.push(`/transactions?search=${encodeURIComponent(inputValue.trim())}`))}
                        >
                            <Search className="mr-2 h-4 w-4" />
                            <span>Search transactions for &quot;{inputValue.trim()}&quot;</span>
                        </CommandItem>
                    </CommandGroup>
                )}

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/transactions"))}>
                        <ListOrdered className="mr-2 h-4 w-4" />
                        <span>Transactions</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/portfolio"))}>
                        <PieChart className="mr-2 h-4 w-4" />
                        <span>Portfolio</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/goals"))}>
                        <Target className="mr-2 h-4 w-4" />
                        <span>Goals</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/budgets"))}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Budgets</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/logs"))}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Logs</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}>
                        {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                        <span>Toggle Theme</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => logout())}>
                        <LogOut className="mr-2 h-4 w-4 text-red-500" />
                        <span className="text-red-500">Sign Out</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
