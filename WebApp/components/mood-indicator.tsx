"use client";

import { useAQIMood } from "@/components/aqi-mood-provider";
import { Cloud, CloudFog, CloudOff, Droplets, Waves, Wind } from "lucide-react";

const moodIcons = {
    pristine: CloudOff,
    fresh: Droplets,
    hazy: Cloud,
    polluted: CloudFog,
    toxic: Wind,
    hazardous: Waves,
};

export function MoodIndicator() {
    const { moodTheme, aqiValue } = useAQIMood();
    const Icon = moodIcons[moodTheme.level];

    return (
        <div className="mood-indicator">
            <Icon className="h-4 w-4" />
            <span>{moodTheme.description}</span>
            <span className="text-xs opacity-70">(AQI: {aqiValue})</span>
        </div>
    );
}
