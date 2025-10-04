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
        0.0: "#00ff00", // Green - Good
        0.2: "#ffff00", // Yellow - Moderate
        0.4: "#ff8000", // Orange - Unhealthy for Sensitive
        0.6: "#ff0000", // Red - Unhealthy
        0.8: "#8000ff", // Purple - Very Unhealthy
        1.0: "#800000", // Maroon - Hazardous
    },
    pm10: {
        0.0: "#00ff00",
        0.25: "#ffff00",
        0.5: "#ff8000",
        0.75: "#ff0000",
        1.0: "#8000ff",
    },
    o3: {
        0.0: "#00ff80", // Light green
        0.3: "#ffff00", // Yellow
        0.6: "#ff8000", // Orange
        0.8: "#ff0000", // Red
        1.0: "#8000ff", // Purple
    },
    no2: {
        0.0: "#0080ff", // Light blue
        0.3: "#00ff00", // Green
        0.5: "#ffff00", // Yellow
        0.7: "#ff8000", // Orange
        1.0: "#ff0000", // Red
    },
    aqi: {
        0.0: "#00e400", // Good - Green
        0.2: "#ffff00", // Moderate - Yellow
        0.4: "#ff7e00", // Unhealthy for Sensitive - Orange
        0.6: "#ff0000", // Unhealthy - Red
        0.8: "#8f3f97", // Very Unhealthy - Purple
        1.0: "#7e0023", // Hazardous - Maroon
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
    radius = 30,
    maxZoom = 15,
    blur = 20,
    max = 1.0,
    customGradient,
}: PollutionHeatmapLayerProps) => {
    const map = useMap();
    const heatLayerRef = useRef<any>(null);

    useEffect(() => {
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