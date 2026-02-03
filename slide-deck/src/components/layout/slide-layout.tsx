import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useSlide } from "../../context/SlideContext";

interface SlideLayoutProps {
    children: React.ReactNode;
    className?: string;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 1.1,
        filter: "blur(20px)",
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.9,
        filter: "blur(10px)",
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
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                filter: { duration: 0.4 },
            }}
            className={cn(
                "absolute inset-0 w-full h-full p-slide-p flex flex-col justify-center",
                className
            )}
        >
            {/* Background Mesh/Noise handled globally or per slide if needed */}
            {children}
        </motion.div>
    );
};
