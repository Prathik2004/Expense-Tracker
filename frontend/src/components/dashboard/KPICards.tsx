import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    BarChart2,
    Percent
} from 'lucide-react';
import { NumberRoller } from '@/components/ui/NumberRoller';

interface KPICardsProps {
    balance: number;
    income: number;
    mainIncome: number;
    sideIncome: number;
    expense: number;
    investment: number;
    sip: number;
    portfolioValue: number;
}

export function KPICards({ balance, income, mainIncome, sideIncome, expense, investment, sip, portfolioValue }: KPICardsProps) {
    const savingsRate = income > 0 ? (investment / income) * 100 : 0;

    return (
        <div className="grid gap-3 grid-cols-2 xl:grid-cols-6 stagger-children">
            <Card className="card-base">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Balance</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground"><NumberRoller value={balance} /></div>
                    <p className="text-xs text-muted-foreground mt-1">Current month</p>
                </CardContent>
            </Card>

            <Card className="card-base">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Income</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-income-soft flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-income" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-income"><NumberRoller value={income} /></div>
                    <p className="text-xs text-muted-foreground mt-1">Main + side</p>
                </CardContent>
            </Card>

            <Card className="card-base">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Main Income</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600"><NumberRoller value={mainIncome} /></div>
                    <p className="text-xs text-muted-foreground mt-1">Salary / primary</p>
                </CardContent>
            </Card>

            <Card className="card-base">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Side Income</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-cyan-100/80 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-cyan-600"><NumberRoller value={sideIncome} /></div>
                    <p className="text-xs text-muted-foreground mt-1">Freelance / gig</p>
                </CardContent>
            </Card>

            <Card className="card-base">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">SIP</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-violet-100/80 flex items-center justify-center">
                        <BarChart2 className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-violet-600"><NumberRoller value={sip} /></div>
                    <p className="text-xs text-muted-foreground mt-1">Recurring investing</p>
                </CardContent>
            </Card>

            <Card className="card-base">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Savings Rate</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                        <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{savingsRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Of income</p>
                </CardContent>
            </Card>
        </div>
    );
}