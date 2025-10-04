// WebApp/app/page.tsx
"use client";

import { AQIStatus } from "@/components/aqi-status";
import { InteractiveMap } from "@/components/interactive-map";
import { ForecastPanel } from "@/components/forecast-panel";
import { HealthGuidance } from "@/components/health-guidance";
import { Header } from "@/components/header";
import { LocationSearch } from "@/components/location-search";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// Dynamically import TempoMap to avoid SSR issues with Leaflet
const TempoMap = dynamic(() => import("@/components/tempo-map"), {
    ssr: false,
    loading: () => (
        <div className="h-96 flex items-center justify-center">
            Loading map...
        </div>
    ),
});

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

                {/* Map Visualization Panel */}
                <div className="w-full">
                    <Tabs defaultValue="interactive" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="interactive">
                                Interactive Map
                            </TabsTrigger>
                            <TabsTrigger value="tempo">
                                TEMPO NO₂ Map
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="interactive" className="mt-2">
                            <InteractiveMap location={currentLocation} />
                        </TabsContent>
                        <TabsContent value="tempo" className="mt-2">
                            <TempoMap date={currentDate} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Forecast Panel - Full width */}
                <div className="w-full">
                    <ForecastPanel location={currentLocation} />
                </div>
            </main>
        </div>
    );
}
