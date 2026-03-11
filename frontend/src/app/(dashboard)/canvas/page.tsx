import { SpatialBoard } from "@/components/canvas/SpatialBoard";

export default function CanvasPage() {
    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.8))] -mt-6 -mx-8">
            {/* 
              We use negative margins to break out of the standard dashboard padded container.
              This allows the canvas to bleed fully to the edges of the screen for maximum spatial planning.
            */}
            <header className="px-8 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Life Canvas</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Map out your financial future on an infinite spatial board.
                </p>
            </header>

            <div className="flex-1 w-full bg-zinc-100 dark:bg-zinc-900 border-b lg:border-none border-zinc-200 dark:border-zinc-800">
                <SpatialBoard />
            </div>
        </div>
    );
}
