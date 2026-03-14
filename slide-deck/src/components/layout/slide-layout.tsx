import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useSlide } from "../../context/SlideContext";

interface SlideLayoutProps {
    children: React.ReactNode;
    className?: string;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 800 : -800,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 800 : -800,
        opacity: 0,
    }),
};

export const SlideLayout = ({ children, className }: SlideLayoutProps) => {
    const { direction } = useSlide();

    return (
        <motion.div
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
            }}
            className={cn(
                "absolute inset-0 w-full h-full p-slide-p flex flex-col justify-center bg-slide",
                className
            )}
        >
            {children}
        </motion.div>
    );
};
