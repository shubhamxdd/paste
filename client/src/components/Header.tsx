import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Code2, Plus, Search, Layers, Activity, Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      {/* Main bar */}
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:block">Pastebin</span>
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-sm">
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

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/gists/new">
              <Layers className="h-4 w-4 mr-1.5" />
              New Gist
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
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

        {/* Mobile right controls */}
        <div className="flex sm:hidden items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false); }}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); }}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="sm:hidden border-t border-border px-4 py-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pastes..."
                autoFocus
                className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-background">
          <nav className="container mx-auto max-w-5xl px-4 py-2 flex flex-col gap-1">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Paste
            </Link>
            <Link
              to="/gists/new"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <Layers className="h-4 w-4" />
              New Gist
            </Link>
            <Link
              to="/status"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <Activity className="h-4 w-4" />
              Status
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
