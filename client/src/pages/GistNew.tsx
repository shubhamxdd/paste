import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listPastes, createCollection, type PasteListItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Search, X, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

export default function GistNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pastes, setPastes] = useState<PasteListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<PasteListItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoadingList(true);
      try {
        const data = await listPastes({ q: q || undefined, page, limit: PAGE_SIZE });
        setPastes(data.pastes);
        setTotal(data.total);
      } catch {
        setPastes([]);
      } finally {
        setLoadingList(false);
      }
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, page]);

  const toggle = (p: PasteListItem) => {
    setSelected((prev) =>
      prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]
    );
  };

  const isSelected = (p: PasteListItem) => !!selected.find((s) => s.id === p.id);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (selected.length === 0) { setError('Select at least one paste'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { id } = await createCollection({ title, paste_ids: selected.map((p) => p.id) });
      navigate(`/gists/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">New Gist</h1>
        <p className="text-muted-foreground text-sm">
          Group existing pastes into one shareable collection.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Gist Title</Label>
          <Input
            id="title"
            placeholder="My awesome gist"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="space-y-1.5">
            <Label>Selected ({selected.length} / 20)</Label>
            <div className="flex flex-wrap gap-2">
              {selected.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/30 rounded-md px-2.5 py-1 text-sm"
                >
                  <span className="max-w-[160px] truncate">{p.title || 'Untitled'}</span>
                  <button type="button" onClick={() => toggle(p)} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paste browser */}
        <div className="space-y-3">
          <Label>Browse Pastes</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Filter pastes..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {loadingList ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))
            ) : pastes.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {q ? `No pastes matching "${q}"` : 'No pastes yet — create one first!'}
              </div>
            ) : (
              pastes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  disabled={!isSelected(p) && selected.length >= 20}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected(p) ? 'bg-primary/5' : ''
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected(p) ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                    }`}
                  >
                    {isSelected(p) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {p.protected && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <p className="text-sm font-medium truncate">{p.title || 'Untitled'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">/p/{p.id}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs shrink-0">
                    {p.language}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive font-medium">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link to="/">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1" size="lg">
            {submitting
              ? 'Creating...'
              : `Create Gist${selected.length > 0 ? ` (${selected.length})` : ''}`}
          </Button>
        </div>
      </form>
    </main>
  );
}
