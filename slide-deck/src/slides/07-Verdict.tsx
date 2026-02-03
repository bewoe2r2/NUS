import { motion } from "framer-motion";
import { SlideLayout } from "../components/layout/slide-layout";
import { Display, H2, Mono } from "../components/ui/typography";

export const VerdictSlide = () => {
    return (
        <SlideLayout className="items-center justify-center text-center">
            <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
                <Display gradient>RESPONSIBLE AI</Display>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 2 }}
                className="mt-12 space-y-4"
            >
                <H2 className="text-secondary/60 font-light">Personalized. Private. Sovereign.</H2>
            </motion.div>

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-24 p-6 border border-white/10 rounded-full bg-white/5 backdrop-blur"
            >
                <Mono>100% ON-DEVICE. 0% CLOUD DEPENDENCY.</Mono>
            </motion.div>
        </SlideLayout>
    );
};
