"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';

export default function IntegrationsPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [investments, setInvestments] = useState<any[]>([]);
    const [portfolioSyncUrl, setPortfolioSyncUrl] = useState('');
    const [savingUrl, setSavingUrl] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const resp = await api.get('/integrations/indmoney/status');
            setStatus(resp.data);
            if (resp.data?.connected) {
                fetchPortfolio();
            } else {
                setInvestments([]);
            }
        } catch (err) {
            setStatus(null);
        } finally { setLoading(false); }
    };

    const fetchPortfolio = async () => {
        try {
            const resp = await api.get('/portfolio');
            setInvestments(resp.data.investments || []);
        } catch (err) {
            setInvestments([]);
        }
    };

    useEffect(() => { fetchStatus(); }, []);

    useEffect(() => {
        const handleSnapshot = async (event: MessageEvent) => {
            if (event.origin !== 'https://www.indmoney.com' && event.origin !== 'https://indmoney.com') return;
            if (event.data?.source !== 'expense-tracker-indmoney' || event.data?.type !== 'INDMONEY_SNAPSHOT') return;

            setProcessing(true);
            try {
                const response = await api.post('/integrations/indmoney/browser-export/import', event.data.payload);
                toast.success('INDmoney snapshot saved', { description: `Imported ${response.data?.fetched || 0} holdings` });
                await fetchStatus();
            } catch (err: any) {
                toast.error('Snapshot import failed', { description: err.response?.data?.message || 'No supported holdings were found.' });
            } finally { setProcessing(false); }
        };

        window.addEventListener('message', handleSnapshot);
        return () => window.removeEventListener('message', handleSnapshot);
    }, []);

    const handleSavePortfolioSyncUrl = async () => {
        setSavingUrl(true);
        try {
            await api.patch('/users/portfolio-sync-url', { portfolioSyncUrl });
            toast.success('OneDrive URL saved', { description: 'Portfolio sync will now use this URL.' });
        } catch (err: any) {
            toast.error('Failed to save URL', { description: err.response?.data?.message || err.message });
        } finally {
            setSavingUrl(false);
        }
    };

    const handleConnect = async () => {
        setProcessing(true);
        const androidBridge = (window as Window & { ExpenseTrackerAndroid?: { openIndmoney: () => void } }).ExpenseTrackerAndroid;
        if (androidBridge) {
            androidBridge.openIndmoney();
            setProcessing(false);
            return;
        }
        const indmoneyWindow = window.open('https://www.indmoney.com/dashboard', 'indmoney-portfolio');
        try {
            const resp = await api.get('/integrations/indmoney/connect');
            if (resp.data?.url) {
                if (indmoneyWindow) indmoneyWindow.location.href = resp.data.url;
                else window.location.href = resp.data.url;
            } else {
                toast.error('Could not start INDmoney connect');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || '';
            if (message.includes('OAuth not configured')) {
                toast.success('INDmoney opened', { description: 'Log in, open your holdings, then click Capture portfolio in the INDmoney tab.' });
            } else {
                toast.error('Connect failed', { description: message || err.message });
            }
        } finally { setProcessing(false); }
    };

    const handleDisconnect = async () => {
        setProcessing(true);
        try {
            await api.delete('/integrations/indmoney');
            toast.success('Disconnected');
            fetchStatus();
        } catch (err) {
            toast.error('Disconnect failed');
        } finally { setProcessing(false); }
    };

    const handleSync = async () => {
        setProcessing(true);
        try {
            const resp = await api.post('/integrations/indmoney/sync');
            toast.success('Sync completed', { description: `Fetched ${resp.data?.fetched || 0} holdings` });
            fetchStatus();
        } catch (err: any) {
            toast.error('Sync failed', { description: err.response?.data?.message || err.message });
        } finally { setProcessing(false); }
    };

    return (
        <div className="space-y-6">
            <div data-tour="page-heading">
                <h1 className="text-3xl font-bold">Integrations</h1>
                <p className="text-zinc-500 mt-1">Connect external providers to import your data.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>INDmoney</CardTitle>
                </CardHeader>
                <CardContent>
                    {!status || !status.connected ? (
                        <div className="space-y-4">
                            <p>Connect using OAuth to sync your portfolio.</p>
                            <Button data-tour="page-action" onClick={handleConnect} disabled={processing} className="bg-purple-600 text-white">{processing ? 'Connecting...' : 'Connect INDmoney'}</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="font-medium">Connected</p>
                            <p>Last synced: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}</p>
                            <p className="text-sm text-zinc-500">Sync status: {status.lastSyncStatus || 'ready'}</p>
                            {status.lastSyncError && <p className="text-sm text-red-600">Last error: {status.lastSyncError}</p>}
                                {investments.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Recent investments</h4>
                                        <ul className="mt-2 space-y-1">
                                            {investments.slice(0,10).map((inv: any) => (
                                                <li key={inv._id} className="flex justify-between">
                                                    <div>
                                                        <div className="font-medium">{inv.name}</div>
                                                        <div className="text-xs text-zinc-500">{inv.assetType} • {inv.symbol || inv.isin || ''}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">₹{Number(inv.convertedCurrentValue || inv.currentValue || 0).toLocaleString('en-IN')}</div>
                                                        <div className="text-xs text-zinc-500">Qty: {inv.quantity || '-'}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            <div className="flex gap-2">
                                <Button data-tour="page-action" onClick={handleSync} disabled={processing} className="bg-purple-600 text-white">Sync Now</Button>
                                <Button variant="outline" onClick={handleDisconnect} disabled={processing}>Disconnect</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>OneDrive Portfolio Sync</CardTitle>
                    <CardDescription>Add a URL to your OneDrive or Google Sheets file to sync portfolio data automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sync-url">Portfolio Spreadsheet URL</Label>
                        <Input
                            id="sync-url"
                            type="url"
                            placeholder="https://onedrive.live.com/... or Google Sheets URL"
                            value={portfolioSyncUrl}
                            onChange={(e) => setPortfolioSyncUrl(e.target.value)}
                            disabled={savingUrl}
                        />
                        <p className="text-xs text-zinc-500">Enter the direct download/CSV export URL from your OneDrive or Google Sheets file.</p>
                    </div>
                    <Button onClick={handleSavePortfolioSyncUrl} disabled={savingUrl || !portfolioSyncUrl} className="bg-purple-600 text-white">
                        {savingUrl ? 'Saving...' : 'Save URL'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5 text-purple-600" />
                        MCP Server (AI Integration)
                    </CardTitle>
                    <CardDescription>Connect AI tools like Claude to access your financial data via Model Context Protocol</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Generate API keys and configure AI assistants to securely access your portfolio,
                        budgets, transactions, goals, and investments.
                    </p>
                    <Link href="/settings/mcp" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
                        Configure MCP Server
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
