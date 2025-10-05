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
        if (theme === "dark") {
            setTheme("light");
        } else {
            setTheme("dark");
        }
    };

    if (!mounted) {
        return null;
    }

    const isDark = theme === "dark";

    return (
        <div className="flex items-center space-x-2">
            <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
            <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
            />
            <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400" />
        </div>
    );
}
