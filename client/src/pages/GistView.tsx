import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCollection, type Collection } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Share2, Lock, Check, ExternalLink, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export default function GistView() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    getCollection(id)
      .then(setCollection)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const toggleCollapse = (pasteId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(pasteId) ? next.delete(pasteId) : next.add(pasteId);
      return next;
    });
  };

  const hlStyle = theme === 'dark' ? atomOneDark : githubGist;

  if (loading) {
    return (
      <main className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </main>
    );
  }

  if (error || !collection) {
    return (
      <main className="container mx-auto max-w-4xl py-10 px-4">
        <p className="text-destructive mb-3">{error || 'Gist not found'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">{collection.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {collection.pastes.length} paste{collection.pastes.length !== 1 ? 's' : ''} · Created{' '}
            {new Date(collection.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare} className="shrink-0">
          {shared ? (
            <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copied!</>
          ) : (
            <><Share2 className="h-3.5 w-3.5 mr-1.5" />Share</>
          )}
        </Button>
      </div>

      {/* Paste list */}
      <div className="space-y-4">
        {collection.pastes.map((paste) => {
          const isCollapsed = collapsed.has(paste.id);
          return (
            <Card key={paste.id} className="overflow-hidden shadow-sm">
              {/* Paste header bar */}
              <CardHeader className="py-2.5 px-4 flex-row items-center justify-between space-y-0 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  {paste.protected && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-sm truncate">
                    {paste.title || 'Untitled'}
                  </span>
                  <Badge variant="secondary" className="font-mono text-xs shrink-0">
                    {paste.language}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link to={`/p/${paste.id}`} target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => toggleCollapse(paste.id)}
                    aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="p-0">
                  {paste.protected ? (
                    <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" />
                      This paste is protected.{' '}
                      <Link to={`/p/${paste.id}`} className="text-primary underline">
                        Open to unlock
                      </Link>
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language={paste.language === 'plaintext' ? 'text' : paste.language}
                      style={hlStyle}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        lineHeight: '1.6',
                        padding: '1rem',
                        background: theme === 'dark' ? 'hsl(222 47% 10%)' : 'hsl(0 0% 100%)',
                        maxHeight: '400px',
                        overflow: 'auto',
                      }}
                      lineNumberStyle={{
                        minWidth: '2.5rem',
                        paddingRight: '1rem',
                        color: theme === 'dark' ? 'hsl(215 20% 35%)' : 'hsl(215 16% 72%)',
                        userSelect: 'none',
                      }}
                    >
                      {paste.content ?? ''}
                    </SyntaxHighlighter>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
