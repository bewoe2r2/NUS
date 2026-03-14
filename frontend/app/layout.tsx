import type { Metadata } from "next";
import "./globals.css";
import { geistSans, geistMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bewo Health",
  description: "AI-Powered Chronic Disease Companion for Singapore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        geistSans.variable,
        geistMono.variable,
        "antialiased bg-neutral-50 text-neutral-900"
      )}>
        {children}
      </body>
    </html>
  );
}
