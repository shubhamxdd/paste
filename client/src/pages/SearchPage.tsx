import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { listPastes, type PasteListItem } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Lock } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<PasteListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(q);
    if (!q) { setResults([]); setTotal(0); return; }
    setLoading(true);
    listPastes({ q })
      .then((data) => { setResults(data.pastes); setTotal(data.total); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  };

  return (
    <main className="container mx-auto max-w-3xl py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Search Pastes</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search by title or content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </form>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && q && results.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No pastes found for <span className="font-medium text-foreground">"{q}"</span>
        </p>
      )}

      {!loading && !q && (
        <p className="text-muted-foreground text-sm">Type something to search across all pastes.</p>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {total} result{total !== 1 ? 's' : ''} for "{q}"
          </p>
          <div className="space-y-2">
            {results.map((p) => (
              <Link
                key={p.id}
                to={`/p/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.protected && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {p.title || 'Untitled'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">/p/{p.id}</p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs shrink-0">
                  {p.language}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
