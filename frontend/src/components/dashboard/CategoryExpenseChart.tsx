"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryChartProps {
    data: { _id: string; total: number }[];
}

const COLORS = [
    '#7c3aed', '#2563eb', '#059669', '#d97706',
    '#dc2626', '#9333ea', '#0891b2', '#db2777'
];

function CustomTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl text-sm">
                <p className="font-semibold">{payload[0].name}</p>
                <p className="text-muted-foreground">₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
        );
    }
    return null;
}

export function CategoryExpenseChart({ data }: CategoryChartProps) {
    const formattedData = data?.map(d => ({ name: d._id, value: d.total })) || [];
    const total = formattedData.reduce((sum, d) => sum + d.value, 0);

    if (formattedData.length === 0) {
        return (
            <Card className="col-span-full lg:col-span-3 card-glow">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No expenses recorded yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full lg:col-span-3 card-glow">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={formattedData}
                                cx="50%"
                                cy="44%"
                                innerRadius={72}
                                outerRadius={105}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-base font-bold leading-tight">
                            ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
