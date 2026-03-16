"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Activity, Frown, Smile, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceModal({ isOpen, onClose }: VoiceModalProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<{ sentiment: number; urgency: string; response?: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Close on Escape key
    const handleEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
    useEffect(() => {
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [handleEscape]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setResult(null);
            setTranscript("");
            setIsListening(false);
            setAnalyzing(false);
            setErrorMsg(null);
        }
    }, [isOpen]);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            setErrorMsg("Voice recognition not supported in this browser.");
            return;
        }
        setErrorMsg(null);

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            setResult(null);
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const checkinResult = await api.voiceCheckin(transcript);

            setResult({
                sentiment: checkinResult.sentiment_score,
                urgency: checkinResult.urgency || "low",
                response: checkinResult.ai_response || (checkinResult.sentiment_score < 0
                    ? "I hear you. I've noted your symptoms for your care team to review."
                    : "Glad to hear you're doing well! Keep up the good work.")
            });

        } catch (error) {
            console.error(error);
            // Fallback to chat if voice endpoint fails
            try {
                const chatResult = await api.chatWithAgent(
                    `Voice check-in from patient: "${transcript}". Analyze sentiment and respond with empathy.`
                );
                const isNegative = transcript.match(/tired|sick|bad|pain|dizzy|cannot|headache|giddy|vomit/i);
                setResult({
                    sentiment: isNegative ? -0.4 : 0.6,
                    urgency: isNegative ? "medium" : "low",
                    response: chatResult?.message || "Check-in recorded."
                });
            } catch {
                setResult({
                    sentiment: 0,
                    urgency: "low",
                    response: "Check-in recorded. Backend may be unavailable."
                });
            }
        } finally {
            setAnalyzing(false);
        }
    };

    const getSentimentIcon = (score: number) => {
        if (score > 0.3) return <Smile size={48} className="text-success-500" />;
        if (score < -0.3) return <Frown size={48} className="text-error-500" />;
        return <Activity size={48} className="text-warning-500" />;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-50"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-neutral-100 rounded-full text-neutral-500">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mt-4">
                            {!result ? (
                                <>
                                    <div className="mb-6 relative">
                                        {isListening && (
                                            <span className="absolute inset-0 bg-accent-500 rounded-full animate-ping opacity-20"></span>
                                        )}
                                        <button
                                            onClick={toggleListening}
                                            aria-label={isListening ? "Stop recording" : "Start recording"}
                                            className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-error-500 text-white shadow-lg scale-110' : 'bg-accent-500 text-white shadow-md'}`}
                                        >
                                            <Mic size={32} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                                        {isListening ? "Listening..." : "Voice Check-in"}
                                    </h3>

                                    {errorMsg && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 border border-warning-200 rounded-xl mb-3 text-sm text-warning-700">
                                            <AlertTriangle size={14} />
                                            {errorMsg}
                                        </div>
                                    )}

                                    <p className="text-neutral-500 text-sm min-h-[60px] mb-6 px-4">
                                        {transcript || "Tap the mic and tell me how you are feeling today."}
                                    </p>

                                    {transcript && !isListening && (
                                        <Button
                                            onClick={handleAnalyze}
                                            className="w-full bg-neutral-900 text-white rounded-full h-12"
                                            disabled={analyzing}
                                        >
                                            {analyzing ? "Analyzing..." : "Submit Check-in"}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <div className="animate-in zoom-in duration-300">
                                    <div className="bg-neutral-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                                        {getSentimentIcon(result.sentiment)}
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Check-in Complete</h3>
                                    <p className="text-neutral-600 mb-6">{result.response}</p>

                                    <div className="flex gap-2 justify-center mb-6">
                                        <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                            Sentiment: {result.sentiment > 0 ? "Positive" : "Negative"}
                                        </span>
                                        {result.urgency === "medium" && (
                                            <span className="px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Flagged for Review
                                            </span>
                                        )}
                                    </div>

                                    <Button onClick={onClose} variant="outline" className="w-full rounded-full border-neutral-200">
                                        Done
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
