import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Bewo — Predictive Chronic Disease Management",
  description:
    "HMM-powered crisis prediction + 18 agentic AI tools for Singapore's 440,000 diabetics. 48-hour advance warning. Doctor-gated clinical decisions.",
  keywords: ["healthcare", "AI", "chronic disease", "diabetes", "Singapore", "HMM", "predictive", "agentic AI"],
  openGraph: {
    title: "Bewo — Predicting Health Crises 48 Hours Early",
    description: "Hidden Markov Models + 18 agentic AI tools. 9 orthogonal biomarkers. Transforming reactive chronic disease management into proactive care.",
    type: "website",
    siteName: "Bewo Health",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bewo — Predicting Health Crises 48 Hours Early",
    description: "HMM-powered crisis prediction + agentic AI for Singapore's aging population. 48-hour advance warning.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable} font-[family-name:var(--font-body)] antialiased`}
      >
        <Nav />
        <main>{children}</main>
        <footer className="border-t border-border-subtle py-8 mt-24">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs font-[family-name:var(--font-mono)] text-ink-muted">
              Bewo 2026 — HMM + Agentic AI for Chronic Disease Management
            </p>
            <p className="text-[10px] text-ink-muted/60 mt-1">
              Blue Ocean Competition 2026
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
