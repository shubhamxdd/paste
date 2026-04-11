import { useRef, useState } from 'react';
import { Upload, X, FileCode } from 'lucide-react';

interface Props {
  onFile: (content: string, language: string, filename: string) => void;
}

const EXT_LANG: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  html: 'html',
  htm: 'html',
  css: 'css',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  ipynb: 'python',
};

function extractNotebook(raw: string): string {
  try {
    const nb = JSON.parse(raw) as {
      cells: Array<{ cell_type: string; source: string[] }>;
    };
    return nb.cells
      .map((cell) => {
        const src = cell.source.join('');
        if (cell.cell_type === 'markdown') {
          return `# [markdown]\n${src
            .split('\n')
            .map((l) => `# ${l}`)
            .join('\n')}`;
        }
        return src;
      })
      .join('\n\n# ─────────────────────────\n\n');
  } catch {
    return raw;
  }
}

export default function FileUploadZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target?.result as string;
      let language = EXT_LANG[ext] ?? 'plaintext';

      if (ext === 'ipynb') {
        content = extractNotebook(content);
        language = 'python';
      }

      setLoadedFile(file.name);
      onFile(content, language, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadedFile(null);
  };

  if (loadedFile) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
        <FileCode className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-primary flex-1 truncate">{loadedFile}</span>
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors select-none ${
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/40'
      }`}
    >
      <Upload className={`h-6 w-6 mx-auto mb-2 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className="text-sm font-medium">Drop a file or click to browse</p>
      <p className="text-xs text-muted-foreground mt-1">
        js · ts · py · rs · go · java · c · cpp · cs · html · css · sql · sh · json · yaml · md · ipynb
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
