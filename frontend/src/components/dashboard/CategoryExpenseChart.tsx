"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryChartProps {
    data: { _id: string; total: number }[];
}

export function CategoryExpenseChart({ data }: CategoryChartProps) {
    // Slate/zinc matching colors with some distinct variations
    const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#64748b', '#0ea5e9', '#ec4899'];

    const formattedData = data?.map(d => ({ name: d._id, value: d.total })) || [];

    if (formattedData.length === 0) {
        return (
            <Card className="col-span-full lg:col-span-3">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-zinc-500 dark:text-zinc-400">No expenses recorded yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full lg:col-span-3">
            <CardHeader>
                <CardTitle className="text-base font-medium">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={formattedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any, name: any) => [`₹${value}`, name]}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
