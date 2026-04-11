import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Code2, Plus, Search, Layers, Activity } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:block">Pastebin</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pastes..."
              className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/gists/new">
              <Layers className="h-4 w-4 mr-1.5" />
              New Gist
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/status">
              <Activity className="h-4 w-4 mr-1.5" />
              Status
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <Plus className="h-4 w-4 mr-1.5" />
              New Paste
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
