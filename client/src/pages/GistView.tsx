import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCollection, deleteCollection, updateCollection, listPastes, type Collection, type PasteListItem } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Share2, Lock, Check, ExternalLink, ChevronDown, ChevronUp, Calendar, Trash2, Pencil, Search, X } from 'lucide-react';

const PAGE_SIZE = 15;

export default function GistView() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Delete state
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSelected, setEditSelected] = useState<PasteListItem[]>([]);
  const [editCode, setEditCode] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pasteList, setPasteList] = useState<PasteListItem[]>([]);
  const [pasteTotal, setPasteTotal] = useState(0);
  const [pasteQ, setPasteQ] = useState('');
  const [pastePage, setPastePage] = useState(1);
  const [loadingPastes, setLoadingPastes] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCollection(id)
      .then(setCollection)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Load paste list when in edit mode
  useEffect(() => {
    if (!editMode) return;
    const t = setTimeout(async () => {
      setLoadingPastes(true);
      try {
        const data = await listPastes({ q: pasteQ || undefined, page: pastePage, limit: PAGE_SIZE });
        setPasteList(data.pastes);
        setPasteTotal(data.total);
      } finally {
        setLoadingPastes(false);
      }
    }, pasteQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [editMode, pasteQ, pastePage]);

  const enterEditMode = () => {
    if (!collection) return;
    setEditTitle(collection.title);
    setEditSelected(
      collection.pastes.map((p) => ({ id: p.id, title: p.title, language: p.language, created_at: p.created_at, protected: p.protected }))
    );
    setEditCode('');
    setEditError('');
    setPasteQ('');
    setPastePage(1);
    setEditMode(true);
  };

  const toggleEditPaste = (p: PasteListItem) => {
    setEditSelected((prev) =>
      prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]
    );
  };

  const isEditSelected = (p: PasteListItem) => !!editSelected.find((s) => s.id === p.id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!editTitle.trim()) { setEditError('Title is required'); return; }
    if (editSelected.length === 0) { setEditError('Select at least one paste'); return; }
    if (!editCode) { setEditError('Delete code is required to save changes'); return; }
    setSaving(true);
    setEditError('');
    try {
      await updateCollection(id, editCode, {
        title: editTitle,
        paste_ids: editSelected.map((p) => p.id),
      });
      const updated = await getCollection(id);
      setCollection(updated);
      setEditMode(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
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
      await deleteCollection(id, deleteCode);
      navigate('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

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
  const pasteTotalPages = Math.ceil(pasteTotal / PAGE_SIZE);

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

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <main className="container mx-auto max-w-4xl py-10 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Edit Gist</h1>
          <p className="text-muted-foreground text-sm">Update the title or pastes in this gist.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Gist Title</Label>
            <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </div>

          {/* Selected chips */}
          {editSelected.length > 0 && (
            <div className="space-y-1.5">
              <Label>Selected ({editSelected.length} / 20)</Label>
              <div className="flex flex-wrap gap-2">
                {editSelected.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/30 rounded-md px-2.5 py-1 text-sm">
                    <span className="max-w-[160px] truncate">{p.title || 'Untitled'}</span>
                    <button type="button" onClick={() => toggleEditPaste(p)} className="hover:opacity-70">
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
                value={pasteQ}
                onChange={(e) => { setPasteQ(e.target.value); setPastePage(1); }}
              />
            </div>
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {loadingPastes ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : pasteList.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No pastes found</div>
              ) : (
                pasteList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleEditPaste(p)}
                    disabled={!isEditSelected(p) && editSelected.length >= 20}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed ${isEditSelected(p) ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isEditSelected(p) ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                      {isEditSelected(p) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground font-mono">/p/{p.id}</p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs shrink-0">{p.language}</Badge>
                  </button>
                ))
              )}
            </div>
            {pasteTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => setPastePage((p) => p - 1)} disabled={pastePage === 1}>Previous</Button>
                <span className="text-xs text-muted-foreground">Page {pastePage} of {pasteTotalPages}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setPastePage((p) => p + 1)} disabled={pastePage === pasteTotalPages}>Next</Button>
              </div>
            )}
          </div>

          {/* Delete code required to save */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-code">Delete Code (required to save)</Label>
            <Input id="edit-code" type="password" placeholder="Enter your delete code" value={editCode} onChange={(e) => setEditCode(e.target.value)} />
          </div>

          {editError && <p className="text-sm text-destructive font-medium">{editError}</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </main>
    );
  }

  // ── View mode ─────────────────────────────────────────────────────────────
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
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleShare}>
            {shared ? (
              <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copied!</>
            ) : (
              <><Share2 className="h-3.5 w-3.5 mr-1.5" />Share</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={enterEditMode}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteClick} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete prompt */}
      {showDeletePrompt && (
        <form onSubmit={handleDelete} className="flex items-center gap-2 mb-6 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
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
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowDeletePrompt(false)}>Cancel</Button>
          {deleteError && <p className="text-xs text-destructive font-medium">{deleteError}</p>}
        </form>
      )}

      {/* Paste list */}
      <div className="space-y-4">
        {collection.pastes.map((paste) => {
          const isCollapsed = collapsed.has(paste.id);
          return (
            <Card key={paste.id} className="overflow-hidden shadow-sm">
              <CardHeader className="py-2.5 px-4 flex-row items-center justify-between space-y-0 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  {paste.protected && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  <span className="font-medium text-sm truncate">{paste.title || 'Untitled'}</span>
                  <Badge variant="secondary" className="font-mono text-xs shrink-0">{paste.language}</Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link to={`/p/${paste.id}`} target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleCollapse(paste.id)}>
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="p-0">
                  {paste.protected ? (
                    <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" />
                      This paste is protected.{' '}
                      <Link to={`/p/${paste.id}`} className="text-primary underline">Open to unlock</Link>
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
