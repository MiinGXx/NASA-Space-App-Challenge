// WebApp/app/page.tsx
"use client";

import { AQIStatus } from "@/components/aqi-status";
import { InteractiveMap } from "@/components/interactive-map";
import { ForecastPanel } from "@/components/forecast-panel";
import { HealthGuidance } from "@/components/health-guidance";
import { Header } from "@/components/header";
import { LocationSearch } from "@/components/location-search";
import TempoMap from "@/components/tempo-map";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
    const [currentLocation, setCurrentLocation] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );

    const handleSearch = (location: string) => {
        console.log("Searching for location:", location);
        setCurrentLocation(location);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <LocationSearch onSearch={handleSearch} />
            <main className="container mx-auto px-4 py-3 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current AQI Status - Takes full width on mobile, 2 columns on desktop */}
                    <div className="lg:col-span-2">
                        <AQIStatus location={currentLocation} />
                    </div>

                    {/* Health Guidance - Sidebar on desktop */}
                    <div className="lg:col-span-1">
                        <HealthGuidance location={currentLocation} />
                    </div>
                </div>

                {/* Map Tabs - Interactive Map and TEMPO NO2 Map */}
                <Tabs defaultValue="interactive" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="interactive">
                            Air Quality Map
                        </TabsTrigger>
                        <TabsTrigger value="tempo">
                            TEMPO NO₂ Concentration
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="interactive">
                        <InteractiveMap location={currentLocation} />
                    </TabsContent>
                    <TabsContent value="tempo">
                        <TempoMap date={currentDate} />
                    </TabsContent>
                </Tabs>

                {/* Forecast Panel - Full width */}
                <div className="w-full">
                    <ForecastPanel location={currentLocation} />
                </div>
            </main>
        </div>
    );
}
