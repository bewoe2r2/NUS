import React, { createContext, useContext, useState, useEffect } from "react";

interface SlideContextType {
    currentSlide: number;
    direction: number;
    totalSlides: number;
    nextSlide: () => void;
    prevSlide: () => void;
    goToSlide: (index: number) => void;
}

const SlideContext = createContext<SlideContextType | undefined>(undefined);

export const SlideProvider = ({ children, totalSlides }: { children: React.ReactNode; totalSlides: number }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setDirection(1);
            setCurrentSlide((prev) => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setDirection(-1);
            setCurrentSlide((prev) => prev - 1);
        }
    };

    const goToSlide = (index: number) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "Space") nextSlide();
            if (e.key === "ArrowLeft") prevSlide();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentSlide]);

    return (
        <SlideContext.Provider value={{ currentSlide, direction, totalSlides, nextSlide, prevSlide, goToSlide }}>
            {children}
        </SlideContext.Provider>
    );
};

export const useSlide = () => {
    const context = useContext(SlideContext);
    if (!context) throw new Error("useSlide must be used within a SlideProvider");
    return context;
};
