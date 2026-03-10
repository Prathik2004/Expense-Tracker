import { useState, useEffect } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, TrendingUp, History, Coins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GoalContributionsListProps {
    isOpen: boolean;
    onClose: () => void;
    goal: {
        _id: string;
        name?: string;
        title?: string;
        currentAmount: number;
        targetAmount: number;
    } | null;
}

const getAssetColor = (type: string) => {
    switch (type.toLowerCase()) {
        case "gold": return "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400";
        case "silver": return "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400";
        case "stocks": return "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
        case "mutual_funds": return "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400";
        case "fds": return "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";
        default: return "bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400"; // liquid & other
    }
};

const formatAssetType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function GoalContributionsList({ isOpen, onClose, goal }: GoalContributionsListProps) {
    const [contributions, setContributions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && goal) {
            fetchContributions();
        }
    }, [isOpen, goal]);

    const fetchContributions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/goals/${goal?._id}/contributions`);
            setContributions(res.data);
        } catch (err) {
            console.error("Failed to fetch contributions", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!goal) return null;
    const goalName = goal.title || goal.name || "Goal";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] p-4 sm:p-6 rounded-xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <DialogTitle>Goal Contributions</DialogTitle>
                    </div>
                    <DialogDescription className="pt-1.5">
                        Investment breakdown for {goalName}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 mt-4 min-h-0 overflow-hidden flex flex-col">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg flex justify-between items-center mb-4 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-sm mb-1">Total Saved</span>
                            <span className="text-xl font-bold flex items-center">
                                <Coins className="w-4 h-4 mr-1.5 text-emerald-500" />
                                ₹{goal.currentAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 -mx-4 px-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                <p className="text-zinc-500 text-sm">Loading historical data...</p>
                            </div>
                        ) : contributions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <History className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                                <h3 className="text-sm font-medium">No contributions yet</h3>
                                <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                                    Add funds to this goal to see your investment breakdown here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-4">
                                {contributions.map((c) => (
                                    <div key={c._id} className="flex items-start justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2 mb-1.5">
                                                <Badge variant="secondary" className={`${getAssetColor(c.assetType)} border-0 font-medium`}>
                                                    {formatAssetType(c.assetType)}
                                                </Badge>
                                                <span className="text-xs text-zinc-400">
                                                    {format(new Date(c.date), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                            {c.notes && (
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic line-clamp-2">
                                                    "{c.notes}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right pl-3 shrink-0">
                                            <div className="font-semibold text-emerald-600 dark:text-emerald-500">
                                                +₹{c.amount.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
