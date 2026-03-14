
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export type MessageRole = "user" | "ai" | "system";

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: string;
    status?: "sending" | "sent" | "error";
}

interface MessageBubbleProps {
    message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <span className="text-xs text-neutral-400 font-mono py-1 px-3 bg-neutral-100 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
                "flex w-full mb-4",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn("flex max-w-[85%] gap-2", isUser && "flex-row-reverse")}>

                {/* AVATAR */}
                <div className={cn(
                    "h-8 w-8 min-w-[2rem] rounded-full flex items-center justify-center border text-white shadow-sm mt-auto",
                    isUser ? "bg-accent-500 border-accent-600" : "bg-white border-neutral-200 text-neutral-600"
                )}>
                    {isUser ? <User size={14} /> : <Bot size={16} />}
                </div>

                {/* BUBBLE */}
                <div className={cn(
                    "relative px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                    isUser
                        ? "bg-accent-500 text-white rounded-2xl rounded-br-sm"
                        : "bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-bl-sm"
                )}>
                    {message.content}

                    {/* TIMESTAMP */}
                    <div className={cn(
                        "text-[10px] mt-1 opacity-70 flex items-center gap-1",
                        isUser ? "justify-end text-accent-100" : "text-neutral-400"
                    )}>
                        {message.timestamp}
                        {isUser && message.status === "sending" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
