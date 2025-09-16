// Type definitions for the NASA CMR API responses
export interface CMRLink {
    rel: string;
    href: string;
}

export interface CMREntry {
    id: string;
    title: string;
    dataset_id?: string;
    summary?: string;
    time_start: string;
    time_end: string;
    links: CMRLink[];
    boxes?: string[][];
    points?: string[][];
}

export interface CMRResponse {
    feed: {
        entry: CMREntry[];
    };
}

// Type definitions for Harmony API responses
export interface HarmonyLink {
    href: string;
    title: string;
    type: string;
    rel: string;
}

export interface HarmonyItem {
    href: string;
    type: string;
    title: string;
    bbox?: number[];
}

export interface HarmonyResponse {
    jobID: string;
    status: string;
    message: string;
    progress: number;
    links: HarmonyLink[];
    request: string;
    items?: HarmonyItem[];
}

// Heatmap data point interface
export interface HeatmapPoint {
    lat: number;
    lng: number;
    value: number;
}
