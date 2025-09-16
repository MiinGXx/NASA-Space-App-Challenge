"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface HealthGuidanceProps {
    location?: string;
}

export function HealthGuidance({ location }: HealthGuidanceProps) {
    const [currentAQI, setCurrentAQI] = useState(42); // Default AQI value

    // Update AQI when location changes
    useEffect(() => {
        if (location) {
            // In a real app, this would fetch health data for the location
            // For now, just generate a random AQI value
            const randomAQI = Math.floor(Math.random() * 200) + 10;
            setCurrentAQI(randomAQI);
        }
    }, [location]);

    const getHealthGuidance = (aqi: number) => {
        if (aqi <= 50) {
            return {
                icon: CheckCircle,
                color: "text-green-600",
                bgColor: "bg-green-50 dark:bg-green-950",
                borderColor: "border-green-200 dark:border-green-800",
                title: "Good Air Quality",
                description:
                    "Air quality is satisfactory and poses little or no health risk.",
                recommendations: [
                    "Perfect day for outdoor activities",
                    "No health precautions needed",
                    "Great time for exercise outdoors",
                ],
            };
        } else if (aqi <= 100) {
            return {
                icon: Shield,
                color: "text-yellow-600",
                bgColor: "bg-yellow-50 dark:bg-yellow-950",
                borderColor: "border-yellow-200 dark:border-yellow-800",
                title: "Moderate Air Quality",
                description:
                    "Air quality is acceptable for most people, but sensitive individuals may experience minor issues.",
                recommendations: [
                    "Sensitive individuals should limit prolonged outdoor exertion",
                    "Most people can enjoy normal outdoor activities",
                    "Consider reducing time outdoors if you have respiratory conditions",
                ],
            };
        } else {
            return {
                icon: AlertTriangle,
                color: "text-red-600",
                bgColor: "bg-red-50 dark:bg-red-950",
                borderColor: "border-red-200 dark:border-red-800",
                title: "Unhealthy Air Quality",
                description:
                    "Air quality may cause health concerns for sensitive groups.",
                recommendations: [
                    "Limit outdoor activities",
                    "Wear a mask when going outside",
                    "Keep windows closed and use air purifiers",
                ],
            };
        }
    };

    const guidance = getHealthGuidance(currentAQI);
    const IconComponent = guidance.icon;

    return (
        <Card className="w-full h-fit">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Health Guidance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert
                    className={`${guidance.bgColor} ${guidance.borderColor}`}
                >
                    <IconComponent className={`h-4 w-4 ${guidance.color}`} />
                    <AlertDescription>
                        <div className="space-y-2">
                            <h4 className="font-semibold">{guidance.title}</h4>
                            <p className="text-sm">{guidance.description}</p>
                        </div>
                    </AlertDescription>
                </Alert>

                <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">
                        Recommendations:
                    </h4>
                    <ul className="space-y-2">
                        {guidance.recommendations.map((rec, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                            >
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                <span className="text-muted-foreground">
                                    {rec}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-4 border-t">
                    <h4 className="font-semibold text-foreground mb-2">
                        Sensitive Groups:
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Children and elderly</p>
                        <p>• People with asthma or heart disease</p>
                        <p>• Pregnant women</p>
                        <p>• Outdoor workers</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
