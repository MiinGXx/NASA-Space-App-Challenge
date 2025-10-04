declare module 'leaflet.heat' {
    import * as L from 'leaflet';
    
    declare module 'leaflet' {
        function heatLayer(latlngs: Array<Array<number>>, options?: any): any;
        
        namespace heatLayer {
            interface HeatMapOptions {
                radius?: number;
                blur?: number;
                max?: number;
                maxZoom?: number;
                gradient?: { [key: string]: string };
            }
        }
    }
}