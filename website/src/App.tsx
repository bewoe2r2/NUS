import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { EditorialLayout } from './components/EditorialLayout';
import { HomePage } from './pages/HomePage';
import { TechnologyPage } from './pages/TechnologyPage';
import { ImpactPage } from './pages/ImpactPage';
import { DemoPage } from './pages/DemoPage';
import './styles/global.css';

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
      <EditorialLayout>
        <AnimatedRoutes />
      </EditorialLayout>
    </BrowserRouter>
  );
}

export default App;
