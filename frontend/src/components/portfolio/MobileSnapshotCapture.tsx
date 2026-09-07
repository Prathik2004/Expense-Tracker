"use client";

import { useState } from "react";
import { createWorker } from "tesseract.js";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Camera, Upload } from "lucide-react";
import { toast } from "sonner";

interface MobileSnapshotCaptureProps {
    onSuccess: () => void;
}

export function MobileSnapshotCapture({ onSuccess }: MobileSnapshotCaptureProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [recognizedText, setRecognizedText] = useState("");

    const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setIsProcessing(true);
        setRecognizedText("");
        try {
            const worker = await createWorker("eng");
            const result = await worker.recognize(file);
            await worker.terminate();
            const text = result.data.text.trim();
            setRecognizedText(text);
            if (!text) throw new Error("No text was recognized. Use a clearer screenshot.");

            await api.post("/integrations/indmoney/browser-export/import", {
                url: "mobile-screenshot",
                title: "INDmoney mobile screenshot",
                capturedAt: new Date().toISOString(),
                tables: [],
                rows: [],
                visibleText: text,
            });
            toast.success("INDmoney snapshot saved", { description: "Values were extracted from your screenshot." });
            onSuccess();
        } catch (error: unknown) {
            const responseMessage = error && typeof error === "object" && "response" in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            toast.error("Could not capture snapshot", { description: responseMessage || (error instanceof Error ? error.message : "Try a clearer screenshot.") });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Camera className="h-5 w-5" /> Mobile snapshot</CardTitle>
                <CardDescription>Take a screenshot of the INDmoney portfolio or choose one from your gallery. Text is recognized on this device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {isProcessing ? "Reading screenshot..." : "Take portfolio screenshot"}
                    <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={handleImage} disabled={isProcessing} />
                </label>
                <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-medium">
                    <Upload className="h-4 w-4" /> Choose screenshot from gallery
                    <input className="sr-only" type="file" accept="image/*" onChange={handleImage} disabled={isProcessing} />
                </label>
                {recognizedText && <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">{recognizedText}</pre>}
            </CardContent>
        </Card>
    );
}
