
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface GlucoseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlucoseModal({ isOpen, onClose }: GlucoseModalProps) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"manual" | "camera">("manual");
    const [analyzing, setAnalyzing] = useState(false);

    // Close on Escape key
    const handleEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
    useEffect(() => {
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [handleEscape]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setValue("");
            setLoading(false);
            setSuccess(false);
            setError(null);
            setActiveTab("manual");
            setAnalyzing(false);
        }
    }, [isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setAnalyzing(true);
        try {
            const res = await api.extractGlucoseFromPhoto(e.target.files[0]);
            if (res.success && res.value) {
                setValue(res.value.toString());
                setActiveTab("manual"); // Switch back to show result
            } else {
                setError("Could not detect glucose value. Please try again.");
            }
        } catch (err) {
            console.error("OCR Error", err);
            setError("Error uploading photo.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        const parsed = parseFloat(value);
        if (isNaN(parsed) || parsed < 1.0 || parsed > 35.0) {
            setError("Please enter a valid glucose reading (1.0 - 35.0 mmol/L).");
            return;
        }
        setLoading(true);
        try {
            await api.logGlucose(parsed);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setLoading(false);
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
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50"
                    />

                    {/* SHEET */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl max-w-md mx-auto"
                    >
                        {/* HEAD */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-neutral-900">Log Glucose</h3>
                            <button onClick={onClose} className="p-2 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* TABS */}
                        <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
                            <button
                                onClick={() => setActiveTab("manual")}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "manual" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"}`}
                            >
                                Manual Entry
                            </button>
                            <button
                                onClick={() => setActiveTab("camera")}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "camera" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"}`}
                            >
                                Camera Scan
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="flex flex-col gap-6">
                            {activeTab === "manual" ? (
                                <>
                                    <div className="flex items-center justify-center gap-3">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className="text-5xl font-bold text-center w-36 bg-transparent border-b-2 border-accent-200 focus:border-accent-500 outline-none py-2 text-neutral-900"
                                        />
                                        <span className="text-xl text-neutral-400 font-medium mt-4">mmol/L</span>
                                    </div>

                                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-center">
                                        <p className="text-sm text-neutral-500">Normal range is <span className="text-success-600 font-bold">4.0 - 7.8</span> before meals.</p>
                                    </div>

                                    {error && (
                                        <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || success}
                                        className={success ? "bg-success-500 hover:bg-success-600" : "bg-accent-500 hover:bg-accent-600"}
                                    >
                                        {loading ? (
                                            <span className="animate-pulse">Saving...</span>
                                        ) : success ? (
                                            <span className="flex items-center gap-2"><Check size={18} /> Saved</span>
                                        ) : (
                                            "Save Reading"
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl">
                                    {analyzing ? (
                                        <div className="text-center">
                                            <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-accent-600 font-semibold">Analyzing Image...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-neutral-500 font-medium mb-4">Upload or Take Photo</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleFileUpload}
                                                className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100"
                                            />
                                            <p className="text-xs text-neutral-400 mt-4 text-center">
                                                Take a clear photo of your glucometer screen.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
