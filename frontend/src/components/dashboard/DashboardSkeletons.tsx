
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function KPICardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="h-[120px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                        <div className="h-4 w-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded mt-1" />
                        <div className="h-3 w-40 bg-zinc-100 dark:bg-zinc-800 rounded mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function RecentTransactionsSkeleton() {
    return (
        <Card className="col-span-full lg:col-span-4 flex flex-col h-[400px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 dark:border-zinc-900 last:border-0">
                        <div className="space-y-1">
                            <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
                            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function CategoryChartSkeleton() {
    return (
        <Card className="col-span-full lg:col-span-3 h-[400px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 animate-pulse">
            <CardHeader>
                <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </CardHeader>
            <CardContent className="flex items-center justify-center pt-8">
                <div className="h-[240px] w-[240px] rounded-full border-8 border-zinc-100 dark:border-zinc-800" />
            </CardContent>
        </Card>
    );
}
