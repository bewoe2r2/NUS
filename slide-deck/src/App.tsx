import { SlideProvider, useSlide } from './context/SlideContext';
import { AnimatePresence } from 'framer-motion';
import {
  HeroSlide,
  ContextSlide,
  SolutionSlide,
  FeaturesSlide,
  HRVSlide,
  DefenseSlide,
  VerdictSlide
} from './slides';

const Deck = () => {
  const { currentSlide, direction } = useSlide();

  const slides = [
    <HeroSlide key="hero" />,
    <ContextSlide key="context" />,
    <SolutionSlide key="solution" />,
    <FeaturesSlide key="features" />,
    <HRVSlide key="hrv" />,
    <DefenseSlide key="defense" />,
    <VerdictSlide key="verdict" />
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slide text-primary selection:bg-accent-cyan/30">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-50">
        <div
          className="h-full bg-accent-cyan transition-all duration-500"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        {slides[currentSlide]}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <SlideProvider totalSlides={7}>
      <Deck />
    </SlideProvider>
  );
}

export default App;
