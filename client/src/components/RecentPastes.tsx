import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecentPastes, type RecentPaste } from '@/hooks/useRecentPastes';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export default function RecentPastes() {
  const { getAll } = useRecentPastes();
  const [pastes, setPastes] = useState<RecentPaste[]>([]);

  useEffect(() => {
    setPastes(getAll());
  }, []);

  if (pastes.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <Clock className="h-3.5 w-3.5" />
        Recently created
      </h2>
      <div className="space-y-0.5">
        {pastes.map((p) => (
          <Link
            key={p.id}
            to={`/p/${p.id}`}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors group"
          >
            <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">
              {p.title || 'Untitled'}
            </span>
            <Badge variant="secondary" className="font-mono text-xs shrink-0">
              {p.language}
            </Badge>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
