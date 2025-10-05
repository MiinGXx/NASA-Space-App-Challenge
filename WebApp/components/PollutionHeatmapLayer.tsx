import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Define different pollutant types
export type PollutantType = "pm25" | "pm10" | "o3" | "no2" | "aqi";

// Define pollution data point
export interface PollutionPoint {
    lat: number;
    lng: number;
    value: number;
    pollutantType: PollutantType;
    location?: string;
    timestamp?: string;
}

// Define props for the PollutionHeatmapLayer component
interface PollutionHeatmapLayerProps {
    points: PollutionPoint[];
    pollutantType: PollutantType;
    radius?: number;
    maxZoom?: number;
    blur?: number;
    max?: number;
    customGradient?: { [key: string]: string };
}

// Extend the Window interface to include the L.heatLayer method
declare global {
    interface Window {
        L: typeof L & {
            heatLayer: (latlngs: any[], options?: any) => any;
        };
    }
}

// Predefined gradients for different pollutants
const POLLUTANT_GRADIENTS: Record<PollutantType, { [key: string]: string }> = {
    pm25: {
        0.0: "#00ff00", // Bright Green - Good
        0.15: "#80ff00", // Lime Green
        0.3: "#ffff00", // Bright Yellow - Moderate
        0.45: "#ff8000", // Bright Orange - Unhealthy for Sensitive
        0.6: "#ff0000", // Bright Red - Unhealthy
        0.75: "#ff00ff", // Magenta - Very Unhealthy
        0.9: "#8000ff", // Purple
        1.0: "#4a0080", // Dark Purple - Hazardous
    },
    pm10: {
        0.0: "#00ff00", // Bright Green
        0.2: "#80ff00", // Lime Green
        0.4: "#ffff00", // Bright Yellow
        0.6: "#ff8000", // Bright Orange
        0.8: "#ff0000", // Bright Red
        1.0: "#8000ff", // Purple
    },
    o3: {
        0.0: "#00ff80", // Bright Light Green
        0.25: "#80ff00", // Lime Green
        0.5: "#ffff00", // Bright Yellow
        0.7: "#ff8000", // Bright Orange
        0.85: "#ff0000", // Bright Red
        1.0: "#8000ff", // Purple
    },
    no2: {
        0.0: "#00ffff", // Bright Cyan
        0.25: "#00ff00", // Bright Green
        0.5: "#ffff00", // Bright Yellow
        0.7: "#ff8000", // Bright Orange
        0.85: "#ff0000", // Bright Red
        1.0: "#8000ff", // Purple
    },
    aqi: {
        0.0: "#00ff00", // Bright Green - Good
        0.15: "#80ff00", // Lime Green
        0.3: "#ffff00", // Bright Yellow - Moderate
        0.45: "#ff8000", // Bright Orange - Unhealthy for Sensitive
        0.6: "#ff0000", // Bright Red - Unhealthy
        0.75: "#ff00ff", // Magenta - Very Unhealthy
        0.9: "#8000ff", // Purple
        1.0: "#4a0080", // Dark Purple - Hazardous
    },
};

// Default max values for normalization
const POLLUTANT_MAX_VALUES: Record<PollutantType, number> = {
    pm25: 150, // μg/m³
    pm10: 250, // μg/m³
    o3: 200,   // μg/m³
    no2: 100,  // μg/m³
    aqi: 300,  // AQI scale
};

const PollutionHeatmapLayer = ({
    points,
    pollutantType,
    radius = 60,
    maxZoom = 15,
    blur = 15,
    max = 1.2,
    customGradient,
}: PollutionHeatmapLayerProps) => {
    const map = useMap();
    const heatLayerRef = useRef<any>(null);

    useEffect(() => {
        console.log("🗺️ PollutionHeatmapLayer received:", { 
            pointsCount: points.length, 
            pollutantType, 
            points: points.slice(0, 3) // Show first 3 points for debugging
        });
        
        // Dynamically import and ensure Leaflet and heat plugin are available
        const initializeHeatmap = async () => {
            if (typeof window === 'undefined') return;

            try {
                const L = await import('leaflet');
                await import('leaflet.heat');
                
                // Check if heatLayer is available
                if (!L.default || !(L.default as any).heatLayer) {
                    console.error("Leaflet.heat is not loaded properly");
                    return;
                }

                // Remove existing heatmap layer if it exists
                if (heatLayerRef.current) {
                    map.removeLayer(heatLayerRef.current);
                }

                if (!points || points.length === 0) {
                    return;
                }

                // Filter points by pollutant type and normalize values
                const filteredPoints = points.filter(point => point.pollutantType === pollutantType);
                const maxValue = POLLUTANT_MAX_VALUES[pollutantType];
                
                // Format points for the heatmap layer with normalized intensities
                const heatPoints = filteredPoints.map((point) => {
                    // Normalize the value to 0-1 range based on pollutant type
                    const normalizedValue = Math.min(point.value / maxValue, 1.0);
                    return [
                        point.lat,
                        point.lng,
                        normalizedValue,
                    ];
                });

                if (heatPoints.length === 0) {
                    return;
                }

                // Use custom gradient or default for pollutant type
                const gradient = customGradient || POLLUTANT_GRADIENTS[pollutantType];

                // Create and add the heatmap layer
                heatLayerRef.current = (L.default as any).heatLayer(heatPoints, {
                    radius,
                    maxZoom,
                    blur,
                    max,
                    gradient,
                }).addTo(map);

            } catch (error) {
                console.error("Error initializing pollution heatmap:", error);
            }
        };

        initializeHeatmap();

        // Cleanup function
        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
            }
        };
    }, [points, pollutantType, radius, maxZoom, blur, max, customGradient, map]);

    // This component doesn't render anything directly
    return null;
};

export default PollutionHeatmapLayer;