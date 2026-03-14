import { SlideProvider, useSlide } from './context/SlideContext';
import { AnimatePresence } from 'framer-motion';
import {
  HookSlide,
  ProblemSlide,
  SolutionSlide,
  ArchitectureSlide,
  PatientSlide,
  NurseSlide,
  IntelligenceSlide,
  SafetySlide,
  ImpactSlide,
  CloseSlide,
} from './slides';

const TOTAL_SLIDES = 10;

const Deck = () => {
  const { currentSlide, direction } = useSlide();

  const slides = [
    <HookSlide key="hook" />,
    <ProblemSlide key="problem" />,
    <SolutionSlide key="solution" />,
    <ArchitectureSlide key="architecture" />,
    <PatientSlide key="patient" />,
    <NurseSlide key="nurse" />,
    <IntelligenceSlide key="intelligence" />,
    <SafetySlide key="safety" />,
    <ImpactSlide key="impact" />,
    <CloseSlide key="close" />,
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slide text-primary">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-border-hairline z-50">
        <div
          className="h-full bg-accent-navy transition-all duration-500"
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
    <SlideProvider totalSlides={TOTAL_SLIDES}>
      <Deck />
    </SlideProvider>
  );
}

export default App;
