import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Define the HeatmapPoint interface directly here
interface HeatmapPoint {
    lat: number;
    lng: number;
    value: number;
}

// Define props for the HeatmapLayer component
interface HeatmapLayerProps {
    points: HeatmapPoint[];
    radius?: number;
    maxZoom?: number;
    blur?: number;
    max?: number;
    gradient?: { [key: string]: string };
}

// Extend the Window interface to include the L.heatLayer method
declare global {
    interface Window {
        L: typeof L & {
            heatLayer: (latlngs: any[], options?: any) => any;
        };
    }
}

const HeatmapLayer = ({
    points,
    radius = 25,
    maxZoom = 15,
    blur = 15,
    max = 1.0,
    gradient = {
        0.4: "blue",
        0.6: "lime",
        0.7: "yellow",
        0.8: "orange",
        1.0: "red",
    },
}: HeatmapLayerProps) => {
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

                // Format points for the heatmap layer
                const heatPoints = points.map((point) => [
                    point.lat,
                    point.lng,
                    point.value,
                ]);

                // Create and add the heatmap layer
                heatLayerRef.current = (L.default as any).heatLayer(heatPoints, {
                    radius,
                    maxZoom,
                    blur,
                    max,
                    gradient,
                }).addTo(map);

            } catch (error) {
                console.error("Error initializing heatmap:", error);
            }
        };

        initializeHeatmap();

        // Cleanup function
        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
            }
        };
    }, [points, radius, maxZoom, blur, max, gradient, map]);

    // This component doesn't render anything directly
    return null;
};

export default HeatmapLayer;
