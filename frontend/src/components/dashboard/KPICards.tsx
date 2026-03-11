import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { NumberRoller } from '@/components/ui/NumberRoller';

interface KPICardsProps {
    balance: number;
    income: number;
    expense: number;
    investment: number;
    portfolioValue: number;
}

export function KPICards({ balance, income, expense, investment, portfolioValue }: KPICardsProps) {

    const savingsRate = income > 0 ? (investment / income) * 100 : 0;

    let roi = 0;
    let hasValuation = portfolioValue > 0;
    if (hasValuation && investment > 0) {
        roi = ((portfolioValue - investment) / investment) * 100;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium tracking-tight">Total Balance</CardTitle>
                    <IndianRupee className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex"><NumberRoller value={balance} /></div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Current month balance
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium tracking-tight">Total Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 flex">
                        <NumberRoller value={income} />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        From all income sources
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium tracking-tight">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-500 flex">
                        <NumberRoller value={expense} />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Total spending this month
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium tracking-tight">Total Investment</CardTitle>
                    <PiggyBank className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-500 flex">
                        <NumberRoller value={investment} />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Total wealth invested
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium tracking-tight">Savings Rate</CardTitle>
                    <PiggyBank className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                        {savingsRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Of total income saved
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
