import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import Home from './pages/Home';

const PasteView = lazy(() => import('./pages/PasteView'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const GistNew = lazy(() => import('./pages/GistNew'));
const GistView = lazy(() => import('./pages/GistView'));

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <Suspense>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/p/:id" element={<PasteView />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/gists/new" element={<GistNew />} />
              <Route path="/gists/:id" element={<GistView />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
