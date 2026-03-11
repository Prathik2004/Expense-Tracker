import { Handle, Position } from '@xyflow/react';
import { Target, ArrowRight } from 'lucide-react';

export function GoalNode({ data }: any) {
    return (
        <div className="relative group px-4 py-3 shadow-xl rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 min-w-[200px] transition-all hover:border-emerald-500/50">
            {/* Input handle (left side) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-zinc-800 dark:bg-zinc-200 border-2 border-white dark:border-zinc-950 transition-colors group-hover:bg-emerald-500"
            />

            <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Target className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {data.label || 'New Goal'}
                    </h3>
                    {data.amount && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                            ₹{data.amount.toLocaleString('en-IN')}
                        </p>
                    )}
                </div>
            </div>

            {/* Output handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-zinc-800 dark:bg-zinc-200 border-2 border-white dark:border-zinc-950 transition-colors group-hover:bg-blue-500"
            />
        </div>
    );
}
