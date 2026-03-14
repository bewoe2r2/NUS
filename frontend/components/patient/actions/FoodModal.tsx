
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface FoodModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FoodModal({ isOpen, onClose }: FoodModalProps) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!value.trim()) return;
        setLoading(true);
        try {
            await api.logFood(value);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setLoading(false);
                setValue("");
                onClose();
            }, 1500);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl max-w-md mx-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-neutral-900">Log Meal</h3>
                            <button onClick={onClose} className="p-2 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="relative">
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="e.g. Chicken Rice with Teh C..."
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-accent-500 outline-none h-32 resize-none placeholder:text-neutral-400"
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={loading || success || !value.trim()}
                                className={success ? "bg-success-500 hover:bg-success-600" : "bg-warning-500 hover:bg-warning-600"}
                            >
                                {loading ? (
                                    <span className="animate-pulse">Analyzing...</span>
                                ) : success ? (
                                    <span className="flex items-center gap-2"><Check size={18} /> Logged</span>
                                ) : (
                                    "Log Food"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
