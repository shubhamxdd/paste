import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import Header from '@/components/Header';
import Home from './pages/Home';
import PasteView from './pages/PasteView';

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/p/:id" element={<PasteView />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}
