import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaste } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, FileCode, Link2 } from 'lucide-react';
import FileUploadZone from '@/components/FileUploadZone';

const LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'python', 'rust', 'go',
  'java', 'c', 'cpp', 'csharp', 'html', 'css', 'sql', 'bash',
  'json', 'yaml', 'markdown',
];

const CUSTOM_ID_RE = /^[a-zA-Z0-9_-]{3,60}$/;

export default function Home() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [paraphrase, setParaphrase] = useState('');
  const [customId, setCustomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (fileContent: string, detectedLang: string, filename: string) => {
    setContent(fileContent);
    setLanguage(detectedLang);
    if (!title) {
      setTitle(filename.replace(/\.[^.]+$/, ''));
    }
  };

  const customIdValid = customId === '' || CUSTOM_ID_RE.test(customId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }
    if (!customIdValid) {
      setError('Custom URL may only contain letters, numbers, hyphens, and underscores (3–60 chars)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { id } = await createPaste({
        title: title || undefined,
        content,
        language,
        paraphrase: paraphrase || undefined,
        customId: customId || undefined,
      });
      navigate(`/p/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const origin = window.location.origin;

  return (
    <main className="container mx-auto max-w-3xl py-10 px-4">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mb-4">
          <FileCode className="h-3.5 w-3.5" />
          <span>No account needed</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Share code, instantly
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Paste your code or text, get a shareable link in seconds.
          Optionally protect it with a paraphrase.
        </p>
      </div>

      {/* Form */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title + Language row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Untitled"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* File upload */}
            <FileUploadZone onFile={handleFile} />

            {/* Content */}
            <div className="space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your code or text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[320px] font-mono text-sm resize-y"
                required
              />
            </div>

            {/* Custom URL */}
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="customId" className="text-sm font-medium">
                  Custom URL
                </Label>
                <span className="text-xs text-muted-foreground ml-auto">optional</span>
              </div>
              <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <span className="px-3 text-sm text-muted-foreground border-r border-input bg-muted h-10 flex items-center shrink-0 select-none">
                  {origin}/p/
                </span>
                <input
                  id="customId"
                  type="text"
                  placeholder="my-snippet"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="flex-1 h-10 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
              {customId && !customIdValid && (
                <p className="text-xs text-destructive pt-0.5">
                  Only letters, numbers, hyphens, underscores — 3 to 60 characters.
                </p>
              )}
              {customId && customIdValid && (
                <p className="text-xs text-muted-foreground pt-0.5">
                  Your paste will be at{' '}
                  <span className="font-mono text-foreground">{origin}/p/{customId}</span>
                </p>
              )}
            </div>

            {/* Paraphrase */}
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="paraphrase" className="text-sm font-medium">
                  Paraphrase Protection
                </Label>
                <span className="text-xs text-muted-foreground ml-auto">optional</span>
              </div>
              <Input
                id="paraphrase"
                type="password"
                placeholder="Set a paraphrase to restrict access"
                value={paraphrase}
                onChange={(e) => setParaphrase(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground pt-0.5">
                Share the paraphrase alongside the link — only people with it can read the paste.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Creating paste...' : 'Create Paste'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
