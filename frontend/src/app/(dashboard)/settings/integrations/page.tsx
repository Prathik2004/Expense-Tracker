"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function IntegrationsPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [investments, setInvestments] = useState<any[]>([]);

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

    const handleConnect = async () => {
        setProcessing(true);
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

    const handleBrowserExportImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setProcessing(true);
        try {
            const payload = JSON.parse(await file.text());
            const response = await api.post('/integrations/indmoney/browser-export/import', payload);
            toast.success('INDmoney export imported', { description: `Imported ${response.data?.fetched || 0} holdings` });
            await fetchStatus();
        } catch (err: any) {
            toast.error('Import failed', { description: err.response?.data?.message || 'Use a valid export with the holdings table visible.' });
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

    return (
        <div className="space-y-6">
            <div>
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
                            <p>Connect using OAuth, or import a local browser export into the deployed app.</p>
                            <Button onClick={handleConnect} disabled={processing} className="bg-purple-600 text-white">{processing ? 'Connecting...' : 'Connect INDmoney'}</Button>
                            <label className="block text-sm text-zinc-500">
                                Import local browser export
                                <input className="mt-2 block w-full text-sm" type="file" accept="application/json,.json" onChange={handleBrowserExportImport} disabled={processing} />
                            </label>
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
                                <Button onClick={handleSync} disabled={processing} className="bg-purple-600 text-white">Sync Now</Button>
                                <Button variant="outline" onClick={handleDisconnect} disabled={processing}>Disconnect</Button>
                            </div>
                            <label className="block text-sm text-zinc-500">
                                Import local browser export
                                <input className="mt-2 block w-full text-sm" type="file" accept="application/json,.json" onChange={handleBrowserExportImport} disabled={processing} />
                            </label>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
