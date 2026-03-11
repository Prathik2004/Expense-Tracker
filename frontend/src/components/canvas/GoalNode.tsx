import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Target, Pencil } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export function GoalNode({ id, data }: { id: string, data: any }) {
    const { setNodes } = useReactFlow();

    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [isEditingAmount, setIsEditingAmount] = useState(false);

    const [labelBuffer, setLabelBuffer] = useState(data.label || '');
    const [amountBuffer, setAmountBuffer] = useState(data.amount ? data.amount.toString() : '');

    const labelInputRef = useRef<HTMLInputElement>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);

    // Focus management when entering edit mode
    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
            labelInputRef.current.select();
        }
    }, [isEditingLabel]);

    useEffect(() => {
        if (isEditingAmount && amountInputRef.current) {
            amountInputRef.current.focus();
            amountInputRef.current.select();
        }
    }, [isEditingAmount]);

    const saveChanges = () => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: labelBuffer || 'Unnamed Goal',
                            amount: amountBuffer ? parseFloat(amountBuffer) : 0,
                        },
                    };
                }
                return node;
            })
        );
        setIsEditingLabel(false);
        setIsEditingAmount(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveChanges();
        }
        if (e.key === 'Escape') {
            // Cancel edits
            setLabelBuffer(data.label || '');
            setAmountBuffer(data.amount ? data.amount.toString() : '');
            setIsEditingLabel(false);
            setIsEditingAmount(false);
        }
    };

    return (
        <div className="relative group px-4 py-3 shadow-xl rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 min-w-[200px] transition-all hover:border-emerald-500/50">
            {/* Mobile-friendly Edit Button */}
            {!isEditingLabel && !isEditingAmount && (
                <div className="absolute top-2 right-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingLabel(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                        aria-label="Edit Goal"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Input handle (left side) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-zinc-800 dark:bg-zinc-200 border-2 border-white dark:border-zinc-950 transition-colors hover:scale-150"
            />

            <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Target className="w-5 h-5" />
                </div>

                <div className="flex-1 overflow-hidden min-w-0">
                    {/* Label Editor */}
                    {isEditingLabel ? (
                        <Input
                            ref={labelInputRef}
                            value={labelBuffer}
                            onChange={(e) => setLabelBuffer(e.target.value)}
                            onBlur={saveChanges}
                            onKeyDown={handleKeyDown}
                            className="h-6 text-sm font-semibold p-1 px-1.5 -ml-1 border-emerald-500/50 focus-visible:ring-emerald-500/30"
                        />
                    ) : (
                        <h3
                            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded px-1 -mx-1"
                            onDoubleClick={() => setIsEditingLabel(true)}
                        >
                            {data.label || 'Unnamed Goal'}
                        </h3>
                    )}

                    {/* Amount Editor */}
                    {isEditingAmount ? (
                        <Input
                            ref={amountInputRef}
                            type="number"
                            value={amountBuffer}
                            onChange={(e) => setAmountBuffer(e.target.value)}
                            onBlur={saveChanges}
                            onKeyDown={handleKeyDown}
                            className="h-5 text-xs p-1 px-1.5 -ml-1 mt-0.5 border-blue-500/50 focus-visible:ring-blue-500/30 font-mono"
                        />
                    ) : (
                        <p
                            className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded px-1 -mx-1 truncate"
                            onDoubleClick={() => setIsEditingAmount(true)}
                        >
                            ₹{(data.amount || 0).toLocaleString('en-IN')}
                        </p>
                    )}
                </div>
            </div>

            {/* Output handle (right side) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-zinc-800 dark:bg-zinc-200 border-2 border-white dark:border-zinc-950 transition-colors hover:scale-150"
            />
        </div>
    );
}
