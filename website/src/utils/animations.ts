import type { Variants } from 'framer-motion';

/*
  §5.1: Custom cubic-bezier easing, NOT ease/linear/easeInOut
  §5.2: Duration = k × sqrt(distance_px), k=15-20
  §7 TRAP 4: Animated elements per viewport ≤ 5

  Framer Motion accepts cubic-bezier as [x1, y1, x2, y2] tuples.
*/

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_IN_OUT },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.25, ease: EASE_IN_OUT },
  },
};

export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};
