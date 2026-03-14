
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [input]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSend(input);
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn(
            "p-3 bg-white/80 backdrop-blur-lg border-t border-neutral-200 transition-all duration-200",
            isFocused && "border-accent-200 bg-white"
        )}>
            <div className="flex items-end gap-2 max-w-md mx-auto">
                {/* ATTACHMENT / VOICE */}
                <Button variant="ghost" size="icon" className="rounded-full text-neutral-400 hover:text-neutral-600 h-10 w-10 shrink-0">
                    <Mic size={20} />
                </Button>

                {/* INPUT FIELD */}
                <div className="flex-1 bg-neutral-100 rounded-2xl border border-transparent focus-within:border-accent-300 focus-within:bg-white focus-within:shadow-subtle transition-all overflow-hidden flex items-end">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Ask Bewo..."
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 max-h-[120px] resize-none text-sm placeholder:text-neutral-400 leading-relaxed"
                    />
                </div>

                {/* SEND BUTTON */}
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className={cn(
                        "rounded-full h-10 w-10 shrink-0 transition-all duration-200",
                        input.trim()
                            ? "bg-accent-500 text-white shadow-md hover:bg-accent-600 scale-100"
                            : "bg-neutral-100 text-neutral-300 scale-95"
                    )}
                >
                    <Send size={18} className={cn(input.trim() && "ml-0.5")} />
                </Button>
            </div>
        </div>
    );
}
