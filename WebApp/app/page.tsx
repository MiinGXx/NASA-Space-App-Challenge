// WebApp/app/page.tsx
"use client";

import { AQIStatus } from "@/components/aqi-status";
import { InteractiveMap } from "@/components/interactive-map";
import { ForecastPanel } from "@/components/forecast-panel";
import { HealthGuidance } from "@/components/health-guidance";
import { Header } from "@/components/header";
import { LocationSearch } from "@/components/location-search";
import TempoMap from "@/components/tempo-map";
import PollutionMap from "@/components/pollution-map";
import {
    PushNotification,
    useNotifications,
} from "@/components/push-notification";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, CheckCircle, Info, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { AQIHigherLowerGame } from "@/components/aqi-higher-lower-game";

export default function HomePage() {
    const [activeMapTab, setActiveMapTab] = useState<string>("interactive");
    const [currentLocation, setCurrentLocation] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );

    // Get browser location and set city on initial load
    useEffect(() => {
        if (!currentLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        // Use OpenStreetMap Nominatim for reverse geocoding
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await res.json();
                        // Try to get city, town, or village
                        const city =
                            data.address.city ||
                            data.address.town ||
                            data.address.village ||
                            data.address.county ||
                            "";
                        if (city) {
                            setCurrentLocation(city);
                        }
                    } catch (err) {
                        // fallback: do nothing
                    }
                });
            }
        }
    }, []);
    const { notification, showNotification, hideNotification } =
        useNotifications();
    const [openGame, setOpenGame] = useState(false);

    const handleSearch = (location: string) => {
        console.log("Searching for location:", location);
        setCurrentLocation(location);
    };

    const triggerNotification = (
        type: "info" | "success" | "warning" | "error"
    ) => {
        const notifications = {
            info: {
                title: "Air Quality Update",
                message:
                    "Air quality data has been refreshed for your location.",
                type: "info" as const,
            },
            success: {
                title: "Location Found",
                message:
                    "Successfully updated air quality data for your selected location.",
                type: "success" as const,
            },
            warning: {
                title: "Air Quality Alert",
                message:
                    "Air quality is approaching unhealthy levels in your area.",
                type: "warning" as const,
            },
            error: {
                title: "Data Error",
                message:
                    "Unable to fetch air quality data. Please try again later.",
                type: "error" as const,
            },
        };

        showNotification(notifications[type]);
    };

    return (
        <div
            className="min-h-screen bg-background/90 backdrop-blur-sm"
            onContextMenu={(e) => e.preventDefault()}
        >
            <Header />
            <LocationSearch onSearch={handleSearch} />
            <main className="container mx-auto px-4 py-3 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Current AQI Status - Takes full width on mobile, 2 columns on desktop */}
                    <div className="lg:col-span-3">
                        <AQIStatus location={currentLocation} />
                    </div>

                    {/* Health Guidance - Sidebar on desktop */}
                    <div className="lg:col-span-2">
                        <HealthGuidance location={currentLocation} />
                    </div>
                </div>

                {/* Map Tabs - Interactive Map, TEMPO NO2 Map, and Pollution Heatmap */}
                <Tabs defaultValue="interactive" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 border border-white/50 rounded-lg">
                        <TabsTrigger
                            value="interactive"
                            className={`flex items-center gap-2 transition-colors duration-200 ${
                                activeMapTab === "interactive"
                                    ? "bg-white/70 border-white/50 dark:bg-white/10 border-white/50 text-foreground rounded-lg shadow"
                                    : ""
                            }`}
                            onClick={() => setActiveMapTab("interactive")}
                        >
                            Interactive Map
                        </TabsTrigger>
                        <TabsTrigger
                            value="tempo"
                            className={`flex items-center gap-2 transition-colors duration-200 ${
                                activeMapTab === "tempo"
                                    ? "bg-white/70 border-white/50 dark:bg-white/10 border-white/50 text-foreground rounded-lg shadow"
                                    : ""
                            }`}
                            onClick={() => setActiveMapTab("tempo")}
                        >
                            TEMPO NO2 Map
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="interactive" className="mt-4">
                        <InteractiveMap location={currentLocation} />
                    </TabsContent>
                    <TabsContent value="tempo" className="mt-4">
                        <TempoMap date={currentDate} />
                    </TabsContent>
                    <TabsContent value="pollution" className="mt-4">
                        <PollutionMap location={currentLocation} />
                    </TabsContent>
                </Tabs>

                {/* Forecast Panel - Full width */}
                <div className="w-full">
                    <ForecastPanel location={currentLocation} />
                </div>

                {/* Notification Demo Buttons - Bottom of page */}
                <div className="w-full py-8 border-t border-border">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold mb-2">
                            Push Notification Demo
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Click any button below to test the push notification
                            component
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            onClick={() => triggerNotification("info")}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Info className="h-4 w-4" />
                            Info Notification
                        </Button>
                        <Button
                            onClick={() => triggerNotification("success")}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Success Notification
                        </Button>
                        <Button
                            onClick={() => triggerNotification("warning")}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Warning Notification
                        </Button>
                        <Button
                            onClick={() => triggerNotification("error")}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Error Notification
                        </Button>
                    </div>
                </div>
            </main>

            {/* Push Notification Component */}
            <PushNotification
                notification={notification}
                onClose={hideNotification}
            />
        </div>
    );
}
