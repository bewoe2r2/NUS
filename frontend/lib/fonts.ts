
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

export const jakartaSans = Plus_Jakarta_Sans({
    variable: "--font-jakarta-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
});

export const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600"],
});

// Backward-compatible aliases
export const geistSans = jakartaSans;
export const geistMono = jetbrainsMono;
