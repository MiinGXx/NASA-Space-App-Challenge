import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { FloatingChatbot } from "@/components/floating-chatbot";
import { AQIMoodProvider } from "@/components/aqi-mood-provider";
import { AppDataProvider } from "@/components/app-data-provider";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "AQI Forecast - Air Quality Index Monitor",
    description:
        "Real-time air quality monitoring with forecasts and health guidance",
    generator: "v0.app",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
            >
                <Suspense fallback={null}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <AppDataProvider>
                            <AQIMoodProvider>
                                {children}
                                <FloatingChatbot />
                            </AQIMoodProvider>
                        </AppDataProvider>
                    </ThemeProvider>
                </Suspense>
                <Analytics />
            </body>
        </html>
    );
}
