
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble, ChatMessage } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Sparkles, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ChatContainer() {
    const [messages, setMessages] = useState<ChatMessage[]>([]); // Start empty, wait for interaction
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    // Initial Greeting from "System" or Real History could go here
    useEffect(() => {
        // For now, let's just push a subtle welcome if empty
        if (messages.length === 0) {
            setMessages([{
                id: "init-legacy",
                role: "ai",
                content: `${getGreeting()}, Mr. Tan. I noticed your glucose is slightly elevated. Have you had breakfast?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
    }, []);

    const handleSendMessage = async (text: string) => {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "sending"
        };

        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // REAL API CALL
            const res = await api.chatWithAgent(text);

            if (!res || typeof res.message !== "string") {
                throw new Error("Invalid response from server");
            }

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: res.message, // Real response from Gemini
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                hmm_state: res.hmm_state,
            };

            setMessages(prev => {
                const updated = prev.map(m => m.id === userMsg.id ? { ...m, status: "sent" } : m);
                return [...updated, aiMsg] as ChatMessage[];
            });

        } catch (err) {
            console.error(err);
            const isTimeout = err instanceof DOMException && err.name === "AbortError";
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "system",
                content: isTimeout
                    ? "Request timed out. The server may be busy — please try again."
                    : `Connection failed: ${err instanceof Error ? err.message : "Could not reach Bewo brain."}`,
                timestamp: ""
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <Card className="flex flex-col h-[500px] w-full border border-neutral-100 shadow-card overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]">

            {/* HEADER */}
            <div className="px-4 py-3 border-b border-neutral-100 bg-white/80 backdrop-blur-md flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent-50 flex items-center justify-center text-accent-500 shadow-sm border border-accent-100">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <div className="font-semibold text-base text-neutral-900">Bewo Assistant</div>
                        <div className="text-xs uppercase font-bold text-accent-500 tracking-wider">Online</div>
                    </div>
                </div>
                <MoreHorizontal size={20} className="text-neutral-400" aria-hidden="true" />
            </div>

            {/* MESSAGES AREA */}
            <div ref={scrollRef} role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-50/50">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 items-start"
                    >
                        <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                            <div className="flex items-center gap-1.5">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                                </div>
                                <span className="text-sm text-neutral-400 ml-2">Analysing your health data...</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* INPUT AREA */}
            <ChatInput onSend={handleSendMessage} isLoading={isTyping} />
        </Card>
    );
}
