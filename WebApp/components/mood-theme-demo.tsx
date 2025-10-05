"use client";

import { useState } from "react";
import { useAQIMood } from "@/components/aqi-mood-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function MoodThemeDemo() {
    const { aqiValue, moodTheme, updateAQI } = useAQIMood();
    const [demoAQI, setDemoAQI] = useState(aqiValue);

    const presetMoods = [
        { label: "Pristine", aqi: 25, description: "Good - Clean air" },
        { label: "Fresh", aqi: 75, description: "Moderate - Acceptable" },
        { label: "Hazy", aqi: 125, description: "Unhealthy for Sensitive" },
        { label: "Polluted", aqi: 175, description: "Unhealthy" },
        { label: "Toxic", aqi: 250, description: "Very Unhealthy" },
        { label: "Hazardous", aqi: 400, description: "Hazardous - Emergency" },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(0, Math.min(500, Number(e.target.value) || 0));
        setDemoAQI(value);
        updateAQI(value);
    };

    const handlePresetClick = (aqi: number) => {
        setDemoAQI(aqi);
        updateAQI(aqi);
    };

    return (
        <Card className="mood-card">
            <CardHeader>
                <CardTitle className="mood-text-primary">
                    🎨 Mood Theme Demo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm mood-text-secondary mb-2">
                        Current Mood:{" "}
                        <strong className="mood-accent">
                            {moodTheme.level}
                        </strong>
                    </p>
                    <p className="text-sm mood-text-secondary mb-4">
                        {moodTheme.description}
                    </p>
                    <p className="text-xs mood-text-secondary">
                        Atmosphere: {moodTheme.atmosphere}
                    </p>
                </div>

                <div>
                    <label className="text-sm mood-text-primary mb-2 block">
                        Enter AQI (0-500):
                    </label>
                    <Input
                        type="number"
                        value={demoAQI}
                        onChange={handleInputChange}
                        min={0}
                        max={500}
                        className="mood-border"
                    />
                </div>

                <div>
                    <p className="text-sm mood-text-primary mb-3">
                        Quick Presets:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {presetMoods.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetClick(preset.aqi)}
                                className="mood-border flex flex-col h-auto py-2"
                                title={preset.description}
                            >
                                <span className="font-semibold">
                                    {preset.label}
                                </span>
                                <span className="text-xs opacity-70">
                                    {preset.aqi}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="p-4 rounded-lg mood-card mood-border border">
                    <p className="text-xs mood-text-secondary">
                        💡 Watch the interface change as you adjust the AQI
                        value. Notice how colors, backgrounds, and atmospheric
                        effects adapt to reflect air quality conditions.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
