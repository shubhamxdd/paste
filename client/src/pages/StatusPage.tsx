import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Activity, Database, Clock, Cpu, FileCode, Layers,
  RefreshCw, Server, CheckCircle2, XCircle,
} from 'lucide-react';

interface HealthData {
  status: 'ok' | 'error';
  uptime: number;
  mongodb: 'connected' | 'unreachable';
  memory: {
    used_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
  node_version: string;
  stats: {
    pastes: number;
    collections: number;
  };
  timestamp: string;
}

const REFRESH_INTERVAL = 30;

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/health');
      const json = await res.json();
      setData(json);
      setError(!res.ok);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
      setLastFetched(new Date());
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastFetched]);

  const heapPct = data
    ? Math.round((data.memory.heap_used_mb / data.memory.heap_total_mb) * 100)
    : 0;

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Server Status</h1>
          <p className="text-sm text-muted-foreground">
            {lastFetched
              ? `Last updated ${lastFetched.toLocaleTimeString()}`
              : 'Fetching…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Refresh in {countdown}s
          </span>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {!loading && (
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 mb-6 ${
            error || data?.status === 'error'
              ? 'border-destructive/40 bg-destructive/5 text-destructive'
              : 'border-green-500/40 bg-green-500/5 text-green-600 dark:text-green-400'
          }`}
        >
          {error || data?.status === 'error' ? (
            <XCircle className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          )}
          <span className="font-medium">
            {error || data?.status === 'error'
              ? 'Server is experiencing issues'
              : 'All systems operational'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Uptime */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {data ? formatUptime(data.uptime) : '—'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* MongoDB */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" /> MongoDB
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <Badge
                variant={data?.mongodb === 'connected' ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {data?.mongodb === 'connected' ? 'Connected' : 'Unreachable'}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Memory (RSS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div>
                <p className="text-2xl font-bold mb-2">
                  {data ? `${data.memory.used_mb} MB` : '—'}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Heap</span>
                    <span>
                      {data?.memory.heap_used_mb} / {data?.memory.heap_total_mb} MB
                      {' '}({heapPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        heapPct > 80 ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${heapPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Node version */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Server className="h-4 w-4" /> Runtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                {data?.node_version ?? '—'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Paste count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCode className="h-4 w-4" /> Total Pastes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {data?.stats.pastes.toLocaleString() ?? '—'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Collection count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" /> Total Gists
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {data?.stats.collections.toLocaleString() ?? '—'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity indicator */}
      {!loading && data && (
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          <span>Server time: {new Date(data.timestamp).toLocaleString()}</span>
        </div>
      )}
    </main>
  );
}
