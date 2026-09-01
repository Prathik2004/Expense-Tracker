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

    const handleConnect = async () => {
        setProcessing(true);
        try {
            const resp = await api.get('/integrations/indmoney/connect');
            if (resp.data?.url) {
                window.location.href = resp.data.url;
            } else {
                toast.error('Could not start INDmoney connect');
            }
        } catch (err: any) {
            toast.error('Connect failed');
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
                            <p>Connect your INDmoney account to automatically sync your investments.</p>
                            <Button onClick={handleConnect} disabled={processing} className="bg-purple-600 text-white">{processing ? 'Connecting...' : 'Connect INDmoney'}</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="font-medium">● Connected</p>
                            <p>Last synced: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}</p>
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
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
