"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        // Add transition class for smooth theme change
        document.documentElement.classList.add('theme-transition');
        
        if (theme === "dark") {
            setTheme("light");
        } else {
            setTheme("dark");
        }

        // Remove transition class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 200);
    };

    if (!mounted) {
        return (
            <div className="flex items-center space-x-2 opacity-0">
                <Sun className="h-[1.2rem] w-[1.2rem]" />
                <div className="h-6 w-11 bg-gray-200 rounded-full" />
                <Moon className="h-[1.2rem] w-[1.2rem]" />
            </div>
        );
    }

    const isDark = theme === "dark";

    return (
        <div className="flex items-center space-x-2">
            <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 transition-colors duration-150" />
            <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
            />
            <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400 transition-colors duration-150" />
        </div>
    );
}
