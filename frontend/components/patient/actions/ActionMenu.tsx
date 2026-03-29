
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Droplets, Utensils, X, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActionMenuProps {
    onLogGlucose: () => void;
    onLogFood: () => void;
    onVoiceCheckIn: () => void;
}

export function ActionMenu({ onLogGlucose, onLogFood, onVoiceCheckIn }: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Menu items config
    const actions = [
        {
            label: "Log Food",
            icon: <Utensils size={20} />,
            color: "bg-[var(--warning-solid)]",
            onClick: () => { setIsOpen(false); onLogFood(); }
        },
        {
            label: "Log Glucose",
            icon: <Droplets size={20} />,
            color: "bg-[var(--error-solid)]",
            onClick: () => { setIsOpen(false); onLogGlucose(); }
        },
        {
            label: "Voice Check-in",
            icon: <Mic size={20} />,
            color: "bg-[var(--accent-500)]",
            onClick: () => { setIsOpen(false); onVoiceCheckIn(); }
        },
    ];

    return (
        <div className="absolute bottom-24 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">

            {/* MENU ITEMS */}
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 mb-2 pointer-events-auto z-50">
                        {actions.map((action, i) => (
                            <motion.div
                                key={action.label}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                                className="flex items-center gap-3"
                            >
                                <span className="text-base font-semibold bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm text-neutral-700">
                                    {action.label}
                                </span>
                                <Button
                                    onClick={action.onClick}
                                    size="icon"
                                    className={cn("h-12 w-12 rounded-full shadow-lg text-white hover:scale-105 transition-transform", action.color)}
                                >
                                    {action.icon}
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* FAB TRIGGER */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.9 }}
                aria-label="Open actions menu"
                aria-expanded={isOpen}
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-white pointer-events-auto transition-all duration-300 z-50",
                    isOpen ? "bg-neutral-800 rotate-45" : "bg-[var(--accent-500)] hover:brightness-110 rotate-0"
                )}
            >
                <Plus size={28} strokeWidth={2.5} />
            </motion.button>

            {/* BACKDROP */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-white/60 backdrop-blur-sm z-30 pointer-events-auto"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
