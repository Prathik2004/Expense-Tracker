
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function KPICardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="h-[120px] animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-3.5 w-24 bg-muted rounded" />
                        <div className="h-8 w-8 bg-muted rounded-xl" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-7 w-32 bg-muted rounded mt-1" />
                        <div className="h-3 w-28 bg-muted rounded mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function RecentTransactionsSkeleton() {
    return (
        <Card className="col-span-full lg:col-span-4 flex flex-col h-[400px] animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-44 bg-muted rounded" />
                </div>
                <div className="h-3.5 w-14 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3 px-6 py-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                        <div className="h-9 w-9 bg-muted rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 w-48 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                        <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function CategoryChartSkeleton() {
    return (
        <Card className="col-span-full lg:col-span-3 h-[400px] animate-pulse">
            <CardHeader>
                <div className="h-4 w-36 bg-muted rounded" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 pt-4">
                <div className="relative">
                    <div className="h-[200px] w-[200px] rounded-full border-[28px] border-muted" />
                </div>
                <div className="flex gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-3 w-16 bg-muted rounded" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
