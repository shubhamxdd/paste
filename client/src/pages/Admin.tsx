import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  listPastes, deletePaste,
  listCollections, deleteCollection,
  type PasteListItem, type CollectionListItem,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, ExternalLink, Trash2, ChevronLeft, ChevronRight, Eye, Shield } from 'lucide-react';

const PAGE_SIZE = 20;
const SESSION_KEY = 'admin_delete_code';

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    // Verify by attempting a harmless API call — we check by trying to list
    // pastes (which doesn't require auth) and trust the code on first delete.
    // Store it and let the first delete validate it server-side.
    sessionStorage.setItem(SESSION_KEY, code);
    onAuth(code);
  };

  return (
    <main className="container mx-auto max-w-sm py-20 px-4">
      <div className="flex flex-col items-center mb-8 gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Shield className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground text-center">Enter your delete code to continue.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Delete Code</Label>
              <Input
                id="code"
                type="password"
                placeholder="Enter delete code"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full" disabled={!code.trim()}>
              Enter
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

// ── Pastes tab ────────────────────────────────────────────────────────────────
function PastesTab({ deleteCode }: { deleteCode: string }) {
  const [pastes, setPastes] = useState<PasteListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPastes({ page, limit: PAGE_SIZE });
      setPastes(data.pastes);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError('');
    try {
      await deletePaste(id, deleteCode);
      setPastes((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
      setConfirmId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} paste{total !== 1 ? 's' : ''} total</p>
      </div>

      {deleteError && (
        <p className="text-sm text-destructive font-medium bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
          {deleteError}
        </p>
      )}

      <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-16 rounded" />
            </div>
          ))
        ) : pastes.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No pastes yet.</div>
        ) : (
          pastes.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {p.protected && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className="text-sm font-medium truncate">{p.title || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">/p/{p.id}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs shrink-0">{p.language}</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" asChild>
                <Link to={`/p/${p.id}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {confirmId === p.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id)}
                  >
                    {deletingId === p.id ? '...' : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => { setConfirmId(p.id); setDeleteError(''); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
            Next<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Gists tab ─────────────────────────────────────────────────────────────────
function GistsTab({ deleteCode }: { deleteCode: string }) {
  const [gists, setGists] = useState<CollectionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCollections({ page, limit: PAGE_SIZE });
      setGists(data.collections);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError('');
    try {
      await deleteCollection(id, deleteCode);
      setGists((prev) => prev.filter((g) => g.id !== id));
      setTotal((t) => t - 1);
      setConfirmId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} gist{total !== 1 ? 's' : ''} total</p>
      </div>

      {deleteError && (
        <p className="text-sm text-destructive font-medium bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
          {deleteError}
        </p>
      )}

      <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
              <Skeleton className="h-7 w-16 rounded" />
            </div>
          ))
        ) : gists.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No gists yet.</div>
        ) : (
          gists.map((g) => (
            <div key={g.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{g.title}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">/gists/{g.id}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{g.paste_count} paste{g.paste_count !== 1 ? 's' : ''}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" asChild>
                <Link to={`/gists/${g.id}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {confirmId === g.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    disabled={deletingId === g.id}
                    onClick={() => handleDelete(g.id)}
                  >
                    {deletingId === g.id ? '...' : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setConfirmId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => { setConfirmId(g.id); setDeleteError(''); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
            Next<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function Admin() {
  const [deleteCode, setDeleteCode] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_KEY)
  );
  const [tab, setTab] = useState<'pastes' | 'gists'>('pastes');

  if (!deleteCode) {
    return <AuthGate onAuth={setDeleteCode} />;
  }

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all pastes and gists.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setDeleteCode(null); }}
        >
          Sign out
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['pastes', 'gists'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'pastes' ? (
        <PastesTab deleteCode={deleteCode} />
      ) : (
        <GistsTab deleteCode={deleteCode} />
      )}
    </main>
  );
}
