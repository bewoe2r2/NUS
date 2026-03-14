
import { Geist, Geist_Mono } from "next/font/google";

export const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap", // Ensure text is visible during load
    weight: ["300", "400", "500", "600", "700"], // Load specific weights for optimization
});

export const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500"],
});
