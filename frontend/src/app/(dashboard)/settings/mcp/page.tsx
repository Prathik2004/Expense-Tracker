"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Copy, Key, Trash2, Plus, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export default function MCPKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['mcp:full_read']);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const AVAILABLE_SCOPES = [
    { value: 'mcp:full_read', label: 'Full Read Access', description: 'Access to all data' },
    { value: 'portfolio:read', label: 'Portfolio', description: 'View portfolio data' },
    { value: 'budget:read', label: 'Budgets', description: 'View budget data' },
    { value: 'transaction:read', label: 'Transactions', description: 'View transactions' },
    { value: 'goals:read', label: 'Goals', description: 'View savings goals' },
    { value: 'investments:read', label: 'Investments', description: 'View investments' },
  ];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await api.get('/mcp/api-keys');
      setApiKeys(response.data.apiKeys || []);
    } catch (error: any) {
      toast.error('Failed to load API keys', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!keyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/mcp/api-keys', {
        name: keyName,
        scopes: selectedScopes,
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerDay: 10000,
        },
      });

      if (response.data.success) {
        setNewKeyValue(response.data.apiKey);
        toast.success('API key created successfully', {
          description: 'Make sure to copy it now - you won\'t see it again!',
        });
        fetchApiKeys();
        setKeyName('');
        setSelectedScopes(['mcp:full_read']);
      }
    } catch (error: any) {
      toast.error('Failed to create API key', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/mcp/api-keys/${id}`);
      if (response.data.success) {
        toast.success('API key revoked');
        fetchApiKeys();
      }
    } catch (error: any) {
      toast.error('Failed to revoke API key', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getConnectionUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/mcp`;
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP Server Configuration</h1>
        <p className="text-zinc-500 mt-1">
          Generate API keys to connect AI tools to your Expense Tracker data
        </p>
      </div>

      {/* Connection Information */}
      <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-purple-600" />
            MCP Server Endpoint
          </CardTitle>
          <CardDescription>Use this URL to connect AI tools to your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={getConnectionUrl()}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(getConnectionUrl(), 'MCP URL')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              How to Connect
            </h4>
            <ol className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>1. Create an API key below</li>
              <li>2. Copy the API key (you'll only see it once)</li>
              <li>3. In Claude Code or other MCP clients, add this server with the URL above</li>
              <li>4. Provide the API key when prompted</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* New Key Created */}
      {newKeyValue && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              API Key Created Successfully
            </CardTitle>
            <CardDescription>
              Copy this key now - you won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newKeyValue}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newKeyValue, 'API key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewKeyValue(null)}
              className="w-full"
            >
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create New Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </span>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Key
            </Button>
          </CardTitle>
          <CardDescription>Manage API keys for connecting AI tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Claude Desktop, Development"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div>
                <Label>Scopes (Permissions)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div
                      key={scope.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedScopes.includes(scope.value)
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
                      }`}
                      onClick={() => toggleScope(scope.value)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{scope.label}</div>
                          <div className="text-xs text-zinc-500">{scope.description}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.value)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createApiKey}
                  disabled={creating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {creating ? 'Creating...' : 'Create API Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setKeyName('');
                    setSelectedScopes(['mcp:full_read']);
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Keys */}
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="border rounded-lg p-4 flex items-start justify-between hover:border-purple-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-zinc-500 mt-1">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && (
                        <span className="ml-3">
                          Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                      Rate Limit: {key.rateLimit.requestsPerMinute}/min, {key.rateLimit.requestsPerDay}/day
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeApiKey(key.id, key.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Available MCP Tools</CardTitle>
          <CardDescription>
            These tools are available to AI assistants with proper API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'Portfolio Summary', scope: 'portfolio:read' },
              { name: 'Portfolio Holdings', scope: 'portfolio:read' },
              { name: 'Portfolio History', scope: 'portfolio:read' },
              { name: 'Active Budgets', scope: 'budget:read' },
              { name: 'Budget Spending', scope: 'budget:read' },
              { name: 'Transactions', scope: 'transaction:read' },
              { name: 'Transaction Stats', scope: 'transaction:read' },
              { name: 'Savings Goals', scope: 'goals:read' },
              { name: 'Goal Contributions', scope: 'goals:read' },
              { name: 'Investment Performance', scope: 'investments:read' },
              { name: 'Asset Allocation', scope: 'investments:read' },
            ].map((tool) => (
              <div
                key={tool.name}
                className="border rounded-lg p-3 flex items-center justify-between"
              >
                <span className="text-sm font-medium">{tool.name}</span>
                <Badge variant="outline" className="text-xs">
                  {tool.scope}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}