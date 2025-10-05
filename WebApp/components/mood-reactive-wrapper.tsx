"use client";

import { useAQIMood } from "@/components/aqi-mood-provider";
import { useEffect } from "react";

interface MoodReactiveWrapperProps {
    children: React.ReactNode;
}

export function MoodReactiveWrapper({ children }: MoodReactiveWrapperProps) {
    const { moodTheme } = useAQIMood();

    // Apply mood theme transition class when mood changes
    useEffect(() => {
        const html = document.documentElement;
        html.classList.add("aqi-mood-transition");

        // Set data attribute for mood-specific styles
        html.setAttribute("data-aqi-mood", moodTheme.level);

        // Remove transition class after animation completes
        const timeout = setTimeout(() => {
            html.classList.remove("aqi-mood-transition");
        }, 1200);

        return () => {
            clearTimeout(timeout);
            html.classList.remove("aqi-mood-transition");
        };
    }, [moodTheme.level]);

    return (
        <div className="mood-reactive-bg min-h-screen relative">
            {/* Atmospheric overlay */}
            <div className="mood-atmosphere" />

            {/* Floating particles for clean air */}
            {(moodTheme.level === "pristine" ||
                moodTheme.level === "fresh") && (
                <div className="mood-particles">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="mood-particle"
                            style={{
                                left: `${i * 8.33 + Math.random() * 5}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: `${8 + Math.random() * 4}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
