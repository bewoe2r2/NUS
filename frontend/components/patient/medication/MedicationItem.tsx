
"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Check, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface MedicationItemProps {
    id: number;
    name: string;
    dose: string;
    time: string;
    isTaken: boolean;
    onToggle: (id: number) => void;
}

export function MedicationItem({ id, name, dose, time, isTaken, onToggle }: MedicationItemProps) {
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);

    // Transform x drag value to background opacity/color — clamp to [0,1] for left-swipe safety
    const bgOpacity = useTransform(x, [0, 100], [0, 1], { clamp: true });
    const scaleIcon = useTransform(x, [0, 50], [0.8, 1.2]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        if (info.offset.x > 100 && !isTaken) {
            // Swiped right enough to complete
            onToggle(id);
            if (navigator.vibrate) navigator.vibrate(50); // Haptic
        } else if (info.offset.x < -100 && isTaken) {
            // Swipe left to undo
            onToggle(id);
        }
    };

    return (
        <div className="relative w-full h-24 touch-none select-none">
            {/* Background Layer (Success State) */}
            <motion.div
                className="absolute inset-0 rounded-2xl flex items-center justify-start px-6 bg-[var(--success-solid)]"
                style={{ opacity: bgOpacity }}
            >
                <motion.div style={{ scale: scaleIcon }}>
                    <Check className="text-white" size={32} strokeWidth={3} />
                </motion.div>
                <span className="ml-4 text-white font-bold tracking-wide uppercase">Taken</span>
            </motion.div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1} // Resistive elasticity
                onDragEnd={handleDragEnd}
                animate={{ x: 0 }} // Always spring back
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                    "relative h-full bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center p-4 transition-colors z-10",
                    isTaken ? "bg-neutral-50/50" : "bg-white"
                )}
            >
                {/* Semantic Left Border */}
                <div className={cn(
                    "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors",
                    isTaken ? "bg-[var(--success-solid)]" : "bg-[var(--accent-500)]"
                )} />

                <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className={cn("text-lg font-semibold text-neutral-900 transition-all", isTaken && "line-through text-neutral-400")}>
                                {name}
                            </h4>
                            <p className="text-base text-neutral-500 flex items-center mt-0.5">
                                <Pill size={14} className="mr-1.5" />
                                {dose}
                            </p>
                        </div>

                        <Badge variant={isTaken ? "success" : "secondary"} className="font-mono text-sm">
                            {time}
                        </Badge>
                    </div>
                </div>

                {/* Checkbox Fallback (Clickable) */}
                <button
                    onClick={() => onToggle(id)}
                    className={cn(
                        "h-11 w-11 rounded-full border-2 ml-4 flex items-center justify-center transition-all shrink-0",
                        isTaken ? "bg-[var(--success-solid)] border-[var(--success-solid)]" : "border-neutral-300 hover:border-[var(--accent-500)]"
                    )}
                >
                    {isTaken && <Check size={20} className="text-white" strokeWidth={3} />}
                </button>

            </motion.div>
        </div>
    );
}
