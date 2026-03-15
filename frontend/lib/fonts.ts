
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

export const geistSans = Plus_Jakarta_Sans({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700", "800"],
});

export const geistMono = JetBrains_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600"],
});
