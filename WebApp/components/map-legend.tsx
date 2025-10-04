"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface LegendProps {
    title: string;
    gradientColors: string[];
    minLabel: string;
    maxLabel: string;
    position: "topleft" | "topright" | "bottomleft" | "bottomright";
}

// Create a custom Leaflet control for the legend
const MapLegend = ({
    title,
    gradientColors,
    minLabel,
    maxLabel,
    position = "bottomright",
}: LegendProps) => {
    const map = useMap();

    useEffect(() => {
        // Create a control
        const legend = new L.Control({ position });

        // Add content to the control when it's added to the map
        legend.onAdd = () => {
            const div = L.DomUtil.create("div", "info legend");
            div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            div.style.backdropFilter = "blur(12px)";
            div.style.padding = "6px 8px";
            div.style.border = "1px solid rgba(255, 255, 255, 0.2)";
            div.style.borderRadius = "4px";
            div.style.lineHeight = "18px";
            div.style.fontFamily = "Arial, Helvetica, sans-serif";
            div.style.fontSize = "12px";
            div.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)";

            // Add the title
            const titleDiv = document.createElement("div");
            titleDiv.innerHTML = `<strong>${title}</strong>`;
            titleDiv.style.marginBottom = "5px";
            div.appendChild(titleDiv);

            // Create the gradient display
            const gradientDiv = document.createElement("div");
            gradientDiv.style.width = "100%";
            gradientDiv.style.height = "20px";
            gradientDiv.style.background = `linear-gradient(to right, ${gradientColors.join(
                ", "
            )})`;
            gradientDiv.style.marginBottom = "5px";
            div.appendChild(gradientDiv);

            // Create labels
            const labelsDiv = document.createElement("div");
            labelsDiv.style.display = "flex";
            labelsDiv.style.justifyContent = "space-between";

            const minDiv = document.createElement("div");
            minDiv.innerHTML = minLabel;

            const maxDiv = document.createElement("div");
            maxDiv.innerHTML = maxLabel;

            labelsDiv.appendChild(minDiv);
            labelsDiv.appendChild(maxDiv);
            div.appendChild(labelsDiv);

            return div;
        };

        // Add the legend to the map
        legend.addTo(map);

        // Clean up when component unmounts
        return () => {
            legend.remove();
        };
    }, [map, title, gradientColors, minLabel, maxLabel, position]);

    // This component doesn't render anything directly to React
    return null;
};

export default MapLegend;
