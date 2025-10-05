"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AQIMoodLevel =
    | "pristine" // 0-50: Good
    | "fresh" // 51-100: Moderate
    | "hazy" // 101-150: Unhealthy for Sensitive Groups
    | "polluted" // 151-200: Unhealthy
    | "toxic" // 201-300: Very Unhealthy
    | "hazardous"; // 301+: Hazardous

export interface AQIMoodColors {
    background: string;
    backgroundGradient: string;
    cardBackground: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    accentColor: string;
    atmosphereOverlay: string;
    shadowColor: string;
}

export interface AQIMoodTheme {
    level: AQIMoodLevel;
    colors: AQIMoodColors;
    description: string;
    atmosphere: "clear" | "light-fog" | "fog" | "heavy-fog" | "smog";
}

interface AQIMoodContextType {
    aqiValue: number;
    moodTheme: AQIMoodTheme;
    updateAQI: (value: number) => void;
}

const AQIMoodContext = createContext<AQIMoodContextType | undefined>(undefined);

// Define mood themes based on AQI levels
const getMoodTheme = (aqi: number, isDark: boolean): AQIMoodTheme => {
    if (aqi <= 50) {
        // Good - Pristine, calming blues and greens
        return {
            level: "pristine",
            description: "Clear skies and fresh air",
            atmosphere: "clear",
            colors: isDark
                ? {
                      background: "from-sky-950 via-blue-950 to-slate-900",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(14, 165, 233, 0.15), transparent 60%), radial-gradient(ellipse at bottom, rgba(34, 211, 238, 0.1), transparent 60%)",
                      cardBackground: "rgba(15, 23, 42, 0.7)",
                      cardBorder: "rgba(56, 189, 248, 0.3)",
                      textPrimary: "rgb(240, 249, 255)",
                      textSecondary: "rgb(186, 230, 253)",
                      accentColor: "rgb(56, 189, 248)",
                      atmosphereOverlay: "rgba(14, 165, 233, 0.05)",
                      shadowColor: "rgba(56, 189, 248, 0.3)",
                  }
                : {
                      background: "from-cyan-50 via-sky-100 to-blue-50",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(125, 211, 252, 0.4), transparent 60%), radial-gradient(ellipse at bottom, rgba(165, 243, 252, 0.3), transparent 60%)",
                      cardBackground: "rgba(255, 255, 255, 0.8)",
                      cardBorder: "rgba(14, 165, 233, 0.2)",
                      textPrimary: "rgb(12, 74, 110)",
                      textSecondary: "rgb(7, 89, 133)",
                      accentColor: "rgb(14, 165, 233)",
                      atmosphereOverlay: "rgba(186, 230, 253, 0.15)",
                      shadowColor: "rgba(14, 165, 233, 0.2)",
                  },
        };
    } else if (aqi <= 100) {
        // Moderate - Fresh, warm yellows and soft greens
        return {
            level: "fresh",
            description: "Acceptable air quality",
            atmosphere: "light-fog",
            colors: isDark
                ? {
                      background: "from-slate-900 via-amber-950 to-slate-900",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(251, 191, 36, 0.12), transparent 60%), radial-gradient(ellipse at bottom, rgba(245, 158, 11, 0.08), transparent 60%)",
                      cardBackground: "rgba(30, 41, 59, 0.75)",
                      cardBorder: "rgba(251, 191, 36, 0.25)",
                      textPrimary: "rgb(254, 249, 195)",
                      textSecondary: "rgb(253, 230, 138)",
                      accentColor: "rgb(251, 191, 36)",
                      atmosphereOverlay: "rgba(251, 191, 36, 0.06)",
                      shadowColor: "rgba(251, 191, 36, 0.25)",
                  }
                : {
                      background: "from-amber-50 via-yellow-50 to-lime-50",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(252, 211, 77, 0.35), transparent 60%), radial-gradient(ellipse at bottom, rgba(234, 179, 8, 0.25), transparent 60%)",
                      cardBackground: "rgba(255, 255, 255, 0.75)",
                      cardBorder: "rgba(234, 179, 8, 0.2)",
                      textPrimary: "rgb(113, 63, 18)",
                      textSecondary: "rgb(161, 98, 7)",
                      accentColor: "rgb(234, 179, 8)",
                      atmosphereOverlay: "rgba(253, 224, 71, 0.12)",
                      shadowColor: "rgba(234, 179, 8, 0.2)",
                  },
        };
    } else if (aqi <= 150) {
        // Unhealthy for Sensitive Groups - Hazy, muted oranges
        return {
            level: "hazy",
            description: "Sensitive groups may experience effects",
            atmosphere: "fog",
            colors: isDark
                ? {
                      background: "from-slate-900 via-orange-950 to-stone-900",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(249, 115, 22, 0.15), transparent 55%), radial-gradient(ellipse at bottom, rgba(234, 88, 12, 0.1), transparent 55%)",
                      cardBackground: "rgba(41, 37, 36, 0.8)",
                      cardBorder: "rgba(249, 115, 22, 0.3)",
                      textPrimary: "rgb(254, 215, 170)",
                      textSecondary: "rgb(253, 186, 116)",
                      accentColor: "rgb(249, 115, 22)",
                      atmosphereOverlay: "rgba(249, 115, 22, 0.08)",
                      shadowColor: "rgba(249, 115, 22, 0.3)",
                  }
                : {
                      background: "from-orange-100 via-amber-100 to-stone-100",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(251, 146, 60, 0.3), transparent 55%), radial-gradient(ellipse at bottom, rgba(245, 158, 11, 0.25), transparent 55%)",
                      cardBackground: "rgba(255, 255, 255, 0.7)",
                      cardBorder: "rgba(249, 115, 22, 0.25)",
                      textPrimary: "rgb(124, 45, 18)",
                      textSecondary: "rgb(154, 52, 18)",
                      accentColor: "rgb(249, 115, 22)",
                      atmosphereOverlay: "rgba(251, 146, 60, 0.15)",
                      shadowColor: "rgba(249, 115, 22, 0.25)",
                  },
        };
    } else if (aqi <= 200) {
        // Unhealthy - Polluted, darker oranges and reds
        return {
            level: "polluted",
            description: "Everyone may experience health effects",
            atmosphere: "heavy-fog",
            colors: isDark
                ? {
                      background: "from-stone-950 via-red-950 to-slate-950",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(239, 68, 68, 0.18), transparent 50%), radial-gradient(ellipse at bottom, rgba(220, 38, 38, 0.12), transparent 50%)",
                      cardBackground: "rgba(28, 25, 23, 0.85)",
                      cardBorder: "rgba(239, 68, 68, 0.35)",
                      textPrimary: "rgb(254, 202, 202)",
                      textSecondary: "rgb(252, 165, 165)",
                      accentColor: "rgb(239, 68, 68)",
                      atmosphereOverlay: "rgba(239, 68, 68, 0.1)",
                      shadowColor: "rgba(239, 68, 68, 0.35)",
                  }
                : {
                      background: "from-red-100 via-orange-100 to-stone-200",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(248, 113, 113, 0.35), transparent 50%), radial-gradient(ellipse at bottom, rgba(239, 68, 68, 0.25), transparent 50%)",
                      cardBackground: "rgba(255, 255, 255, 0.65)",
                      cardBorder: "rgba(220, 38, 38, 0.3)",
                      textPrimary: "rgb(127, 29, 29)",
                      textSecondary: "rgb(153, 27, 27)",
                      accentColor: "rgb(220, 38, 38)",
                      atmosphereOverlay: "rgba(248, 113, 113, 0.18)",
                      shadowColor: "rgba(220, 38, 38, 0.3)",
                  },
        };
    } else if (aqi <= 300) {
        // Very Unhealthy - Toxic, deep purples and reds
        return {
            level: "toxic",
            description: "Health alert - everyone at risk",
            atmosphere: "smog",
            colors: isDark
                ? {
                      background: "from-violet-950 via-purple-950 to-slate-950",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(168, 85, 247, 0.2), transparent 45%), radial-gradient(ellipse at bottom, rgba(147, 51, 234, 0.15), transparent 45%)",
                      cardBackground: "rgba(23, 23, 23, 0.9)",
                      cardBorder: "rgba(168, 85, 247, 0.4)",
                      textPrimary: "rgb(243, 232, 255)",
                      textSecondary: "rgb(233, 213, 255)",
                      accentColor: "rgb(168, 85, 247)",
                      atmosphereOverlay: "rgba(168, 85, 247, 0.12)",
                      shadowColor: "rgba(168, 85, 247, 0.4)",
                  }
                : {
                      background: "from-purple-200 via-violet-200 to-gray-300",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(196, 181, 253, 0.5), transparent 45%), radial-gradient(ellipse at bottom, rgba(167, 139, 250, 0.4), transparent 45%)",
                      cardBackground: "rgba(255, 255, 255, 0.6)",
                      cardBorder: "rgba(147, 51, 234, 0.35)",
                      textPrimary: "rgb(76, 29, 149)",
                      textSecondary: "rgb(107, 33, 168)",
                      accentColor: "rgb(147, 51, 234)",
                      atmosphereOverlay: "rgba(196, 181, 253, 0.2)",
                      shadowColor: "rgba(147, 51, 234, 0.35)",
                  },
        };
    } else {
        // Hazardous - Dark, ominous maroons and deep reds
        return {
            level: "hazardous",
            description: "Health emergency - avoid outdoor activity",
            atmosphere: "smog",
            colors: isDark
                ? {
                      background: "from-gray-950 via-red-950 to-stone-950",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(127, 29, 29, 0.25), transparent 40%), radial-gradient(ellipse at bottom, rgba(153, 27, 27, 0.2), transparent 40%)",
                      cardBackground: "rgba(23, 23, 23, 0.95)",
                      cardBorder: "rgba(185, 28, 28, 0.5)",
                      textPrimary: "rgb(254, 226, 226)",
                      textSecondary: "rgb(254, 202, 202)",
                      accentColor: "rgb(185, 28, 28)",
                      atmosphereOverlay: "rgba(127, 29, 29, 0.15)",
                      shadowColor: "rgba(185, 28, 28, 0.5)",
                  }
                : {
                      background: "from-gray-400 via-stone-400 to-red-300",
                      backgroundGradient:
                          "radial-gradient(ellipse at top, rgba(153, 27, 27, 0.4), transparent 40%), radial-gradient(ellipse at bottom, rgba(127, 29, 29, 0.35), transparent 40%)",
                      cardBackground: "rgba(255, 255, 255, 0.5)",
                      cardBorder: "rgba(153, 27, 27, 0.4)",
                      textPrimary: "rgb(69, 10, 10)",
                      textSecondary: "rgb(127, 29, 29)",
                      accentColor: "rgb(153, 27, 27)",
                      atmosphereOverlay: "rgba(153, 27, 27, 0.25)",
                      shadowColor: "rgba(153, 27, 27, 0.4)",
                  },
        };
    }
};

export function AQIMoodProvider({ children }: { children: React.ReactNode }) {
    const [aqiValue, setAqiValue] = useState<number>(50);
    const [isDark, setIsDark] = useState<boolean>(false);

    // Detect theme changes
    useEffect(() => {
        const updateTheme = () => {
            setIsDark(document.documentElement.classList.contains("dark"));
        };

        updateTheme();

        // Watch for theme changes
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const moodTheme = getMoodTheme(aqiValue, isDark);

    const updateAQI = (value: number) => {
        setAqiValue(Math.max(0, Math.min(500, value)));
    };

    // Apply CSS variables to the document root
    useEffect(() => {
        const root = document.documentElement;
        const colors = moodTheme.colors;

        root.style.setProperty("--aqi-mood-bg", colors.background);
        root.style.setProperty(
            "--aqi-mood-gradient",
            colors.backgroundGradient
        );
        root.style.setProperty("--aqi-mood-card-bg", colors.cardBackground);
        root.style.setProperty("--aqi-mood-card-border", colors.cardBorder);
        root.style.setProperty("--aqi-mood-text-primary", colors.textPrimary);
        root.style.setProperty(
            "--aqi-mood-text-secondary",
            colors.textSecondary
        );
        root.style.setProperty("--aqi-mood-accent", colors.accentColor);
        root.style.setProperty("--aqi-mood-overlay", colors.atmosphereOverlay);
        root.style.setProperty("--aqi-mood-shadow", colors.shadowColor);
        root.style.setProperty("--aqi-mood-level", moodTheme.level);
    }, [moodTheme]);

    return (
        <AQIMoodContext.Provider value={{ aqiValue, moodTheme, updateAQI }}>
            {children}
        </AQIMoodContext.Provider>
    );
}

export function useAQIMood() {
    const context = useContext(AQIMoodContext);
    if (context === undefined) {
        throw new Error("useAQIMood must be used within an AQIMoodProvider");
    }
    return context;
}
