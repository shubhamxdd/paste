import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import Home from './pages/Home';
import PasteView from './pages/PasteView';
import SearchPage from './pages/SearchPage';
import GistNew from './pages/GistNew';
import GistView from './pages/GistView';

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/p/:id" element={<PasteView />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/gists/new" element={<GistNew />} />
            <Route path="/gists/:id" element={<GistView />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
