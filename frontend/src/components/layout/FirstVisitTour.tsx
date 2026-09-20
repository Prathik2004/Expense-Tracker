"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

const TOUR_VERSION = "3";

const tourSteps = [
    { path: "/", element: "[data-tour='dashboard-summary']", title: "Welcome to Expensify", description: "This is your monthly financial snapshot. Your balance, income, spending, and investments update as you add transactions." },
    { path: "/", element: "[data-tour='magic-input']", title: "Add an expense in one line", description: "Type something like 150 food coffee and we will fill in the details for you." },
    { path: "/", element: "[data-tour='add-transaction']", title: "Add with the full form", description: "Use this button any time to record income, an expense, or an investment with all its details." },
    { path: "/transactions", element: "[data-tour='page-heading']", title: "Transactions", description: "Next, let us look at the complete history of your money movements." },
    { path: "/transactions", element: "[data-tour='page-tools']", title: "Search and filter", description: "Use these controls to quickly find entries by type, date, category, or amount." },
    { path: "/transactions", element: "[data-tour='page-action']", title: "Add a transaction", description: "Record a new item here whenever money moves." },
    { path: "/budgets", element: "[data-tour='page-heading']", title: "Budgets", description: "Set monthly spending limits for the categories that matter to you." },
    { path: "/budgets", element: "[data-tour='page-action']", title: "Create a budget", description: "Add a category and a limit to start tracking your spending." },
    { path: "/goals", element: "[data-tour='page-heading']", title: "Savings goals", description: "Give your savings a purpose and follow your progress over time." },
    { path: "/goals", element: "[data-tour='page-action']", title: "Create a goal", description: "Set a target amount and date, then add funds as you save." },
    { path: "/portfolio", element: "[data-tour='page-heading']", title: "Portfolio", description: "View your investments and their current value in one place." },
    { path: "/portfolio", element: "[data-tour='page-action']", title: "Refresh portfolio data", description: "Sync your latest portfolio values whenever you need an update." },
    { path: "/lending", element: "[data-tour='page-heading']", title: "Lending", description: "Keep a clear record of money you have lent and why." },
    { path: "/lending", element: "[data-tour='page-action']", title: "Add a lending record", description: "Record the person, amount, and reason so nothing slips through the cracks." },
    { path: "/settings/integrations", element: "[data-tour='page-heading']", title: "Integrations", description: "Connect supported services to bring your financial data into Expensify." },
    { path: "/settings/integrations", element: "[data-tour='page-action']", title: "Connect or sync", description: "Use this control to connect INDmoney or refresh an existing connection." },
    { path: "/settings/integrations", title: "You are ready to go", description: "That is the full tour. You can revisit any section from the navigation whenever you need it." },
] as const;

export function FirstVisitTour() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (!user || pathname !== "/") return;

        const userId = user._id || user.id;
        const storageKey = `expense-tracker:onboarding:${TOUR_VERSION}:${userId}`;
        if (localStorage.getItem(storageKey)) return;

        const timer = window.setTimeout(() => {
            const goToStep = (currentIndex: number, nextIndex: number, move: () => void) => {
                const current = tourSteps[currentIndex];
                const next = tourSteps[nextIndex];

                if (!next) return;
                if (current.path === next.path) {
                    move();
                    return;
                }

                router.push(next.path);
                window.setTimeout(move, 500);
            };

            const tour = driver({
                animate: true,
                overlayColor: "#020617",
                overlayOpacity: 0.65,
                showProgress: true,
                progressText: "{{current}} of {{total}}",
                allowClose: true,
                stagePadding: 8,
                stageRadius: 12,
                popoverClass: "expense-tracker-tour",
                nextBtnText: "Next",
                prevBtnText: "Back",
                doneBtnText: "Finish tour",
                steps: tourSteps.map(({ element, title, description }) => ({
                    element,
                    popover: {
                        title,
                        description,
                        side: element ? "bottom" : undefined,
                        align: element ? "start" : undefined,
                    },
                })),
                onNextClick: (_element, _step, { driver: activeTour }) => {
                    const currentIndex = activeTour.getActiveIndex() ?? 0;
                    const nextIndex = currentIndex + 1;
                    if (nextIndex >= tourSteps.length) {
                        activeTour.destroy();
                        return;
                    }
                    goToStep(currentIndex, nextIndex, () => activeTour.moveNext());
                },
                onPrevClick: (_element, _step, { driver: activeTour }) => {
                    const currentIndex = activeTour.getActiveIndex() ?? 0;
                    if (currentIndex === 0) return;
                    goToStep(currentIndex, currentIndex - 1, () => activeTour.movePrevious());
                },
                onDestroyed: () => localStorage.setItem(storageKey, "seen"),
            });

            tour.drive();
        }, 700);

        return () => window.clearTimeout(timer);
    }, [pathname, router, user]);

    return null;
}
