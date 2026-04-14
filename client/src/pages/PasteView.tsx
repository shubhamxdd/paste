import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPaste, unlockPaste, deletePaste, type Paste } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Lock, ExternalLink, Check, Calendar, Share2, Trash2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function parseLineHash(hash: string): number | null {
  const m = hash.match(/^#?L(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

export default function PasteView() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [paste, setPaste] = useState<Paste | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paraphrase, setParaphrase] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!id) return;
    getPaste(id)
      .then(setPaste)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Read hash on load and on hash change
  useEffect(() => {
    const read = () => setHighlightedLine(parseLineHash(window.location.hash));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  // Scroll to highlighted line after paste loads
  useEffect(() => {
    if (highlightedLine && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedLine, paste]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !paraphrase) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      const unlocked = await unlockPaste(id, paraphrase);
      setPaste(unlocked);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Incorrect paraphrase');
    } finally {
      setUnlocking(false);
    }
  };

  const handleCopy = () => {
    if (paste?.content) {
      navigator.clipboard.writeText(paste.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleDeleteClick = () => {
    setShowDeletePrompt(true);
    setDeleteCode('');
    setDeleteError('');
    setTimeout(() => deleteInputRef.current?.focus(), 50);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !deleteCode) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deletePaste(id, deleteCode);
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  const handleLineClick = (lineNumber: number) => {
    const newHash = `L${lineNumber}`;
    window.location.hash = newHash;
    setHighlightedLine(lineNumber);
  };

  if (loading) {
    return (
      <main className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-14" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto max-w-4xl py-10 px-4">
        <Card className="border-destructive/50 bg-destructive/5 max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium mb-3">{error}</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!paste) return null;

  // Protected and not yet unlocked
  if (paste.protected && !paste.content) {
    return (
      <main className="container mx-auto max-w-md py-10 px-4">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mx-auto mb-2">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-center text-xl">Protected Paste</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{paste.title || 'This paste'}</span> requires
              a paraphrase to view.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="paraphrase">Paraphrase</Label>
                <Input
                  id="paraphrase"
                  type="password"
                  placeholder="Enter paraphrase"
                  value={paraphrase}
                  onChange={(e) => setParaphrase(e.target.value)}
                  autoFocus
                />
              </div>
              {unlockError && (
                <p className="text-sm text-destructive font-medium">{unlockError}</p>
              )}
              <Button type="submit" disabled={unlocking} className="w-full">
                {unlocking ? 'Unlocking...' : 'Unlock Paste'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const hlStyle = theme === 'dark' ? atomOneDark : githubGist;
  const highlightBg = theme === 'dark' ? 'rgba(255,255,100,0.08)' : 'rgba(255,220,0,0.2)';

  return (
    <main className="container mx-auto max-w-4xl py-8 px-4">
      {/* Metadata bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold truncate">
              {paste.title || 'Untitled'}
            </h1>
            {paste.protected && (
              <span title="Protected paste">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-mono text-xs">
              {paste.language}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(paste.created_at).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {(paste.views ?? 0).toLocaleString()} view{paste.views !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleShare}>
            {shared ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                Link copied!
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/pastes/${id}/raw`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Raw
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteClick} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete prompt */}
      {showDeletePrompt && (
        <form onSubmit={handleDelete} className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <Input
            ref={deleteInputRef}
            type="password"
            placeholder="Enter delete code"
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value)}
            className="h-8 text-sm max-w-xs"
          />
          <Button type="submit" size="sm" variant="destructive" disabled={deleting || !deleteCode}>
            {deleting ? 'Deleting...' : 'Confirm'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowDeletePrompt(false)}>
            Cancel
          </Button>
          {deleteError && <p className="text-xs text-destructive font-medium">{deleteError}</p>}
        </form>
      )}

      {/* Code block */}
      <Card className="overflow-hidden shadow-md">
        <SyntaxHighlighter
          language={paste.language === 'plaintext' ? 'text' : paste.language}
          style={hlStyle}
          showLineNumbers
          wrapLines
          lineProps={(lineNumber) => {
            const isHighlighted = lineNumber === highlightedLine;
            return {
              id: `L${lineNumber}`,
              ref: isHighlighted ? (el: HTMLElement | null) => { highlightRef.current = el; } : undefined,
              onClick: () => handleLineClick(lineNumber),
              style: {
                display: 'block',
                cursor: 'pointer',
                backgroundColor: isHighlighted ? highlightBg : 'transparent',
              },
            };
          }}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            padding: '1.25rem 1rem',
            background: theme === 'dark' ? 'hsl(222 47% 10%)' : 'hsl(0 0% 100%)',
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
      </Card>
      {highlightedLine && (
        <p className="text-xs text-muted-foreground mt-2">
          Line {highlightedLine} highlighted —{' '}
          <button
            className="underline hover:text-foreground"
            onClick={() => { window.location.hash = ''; setHighlightedLine(null); }}
          >
            clear
          </button>
        </p>
      )}
    </main>
  );
}
