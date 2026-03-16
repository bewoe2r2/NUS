import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { EditorialLayout } from './components/EditorialLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const TechnologyPage = lazy(() => import('./pages/TechnologyPage').then(m => ({ default: m.TechnologyPage })));
const ImpactPage = lazy(() => import('./pages/ImpactPage').then(m => ({ default: m.ImpactPage })));
const DemoPage = lazy(() => import('./pages/DemoPage').then(m => ({ default: m.DemoPage })));

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/technology" element={<TechnologyPage />} />
        <Route path="/impact" element={<ImpactPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <EditorialLayout>
          <Suspense fallback={<div>Loading...</div>}>
            <AnimatedRoutes />
          </Suspense>
        </EditorialLayout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
