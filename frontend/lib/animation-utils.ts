
import { Variants } from "framer-motion";

const EASE_ELITE = [0.33, 1, 0.68, 1] as const;

export const fadeInUp: Variants = {
    initial: {
        opacity: 0,
        y: 20,
        filter: "blur(8px)"
    },
    animate: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.6,
            ease: EASE_ELITE
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: 0.3 }
    }
};

export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};
