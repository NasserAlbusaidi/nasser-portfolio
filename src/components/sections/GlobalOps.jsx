import React, { useState, useEffect, useRef } from 'react';
// For mapbox-gl v3+
import Map, { Source, Layer } from "react-map-gl/mapbox";
import { Globe, Maximize2, Terminal } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function GlobalOps() {
    const [viewState, setViewState] = useState({
        longitude: 58.4, // Muscat approx
        latitude: 23.6,
        zoom: 10,
        bearing: 0,
        pitch: 0
    });
    const [mapData, setMapData] = useState(null);
    const mapRef = useRef();

    // Load the GeoJSON we generated
    useEffect(() => {
        // Add ?t=timestamp to bypass browser cache
        fetch(`/mission_paths.json?t=${new Date().getTime()}`)
            .then(res => res.json())
            .then(data => {
                setMapData(data);
                console.log(`🗺️ Map Loaded: ${data.features.length} paths`);
            })
            .catch(err => console.error("Map Data Offline:", err));
    }, []);

    // Rotate the globe slowly
    useEffect(() => {
        if (!mapRef.current) return;
        const interval = setInterval(() => {
            setViewState(v => ({
                ...v,
                longitude: v.longitude + 0.1 // Slow spin
            }));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-16 px-4 md:px-8 min-h-[80vh] border-t border-neutral-800 bg-[#050505] relative overflow-hidden">

            {/* Header */}
            <div className="mb-12 flex justify-between items-end relative z-10 pointer-events-none">
                <div>
                    <div className="flex items-center gap-2 text-neon-orange text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                        <Globe className="w-4 h-4" /> GLOBAL_OPS // THEATRE
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter font-orbitron">
                        TERRITORY <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-700 to-neutral-900">CONTROL</span>
                    </h1>
                </div>
                <div className="text-right">
                    <div className="text-xs font-mono text-neutral-500">ACTIVE ZONES</div>
                    <div className="text-xl text-white font-bold">MUSCAT / GLOBAL</div>
                </div>
            </div>

            {/* The Map Container */}
            <div className="w-full h-[600px] border border-neutral-800 rounded-lg overflow-hidden relative group">

                <Map
                    {...viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    ref={mapRef}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    mapboxAccessToken={MAPBOX_TOKEN}
                    projection="globe" // <--- 3D Globe Mode
                    fog={{
                        "range": [0.5, 10],
                        "color": "#000000",
                        "horizon-blend": 0.1
                    }}
                    reuseMaps
                >
                    {mapData && (
                        <Source id="my-data" type="geojson" data={mapData}>
                            {/* Bike Layer (Orange) */}
                            <Layer
                                id="bike-layer"
                                type="line"
                                filter={['==', 'type', 'bike']}
                                paint={{
                                    'line-color': '#FF4500',
                                    'line-width': 2,
                                    'line-opacity': 0.6,
                                    'line-blur': 1
                                }}
                            />
                            {/* Run Layer (Green) */}
                            <Layer
                                id="run-layer"
                                type="line"
                                filter={['==', 'type', 'run']}
                                paint={{
                                    'line-color': '#00FF41',
                                    'line-width': 2,
                                    'line-opacity': 0.8,
                                    'line-blur': 1
                                }}
                            />
                            {/* Swim Layer (Cyan/Blue) */}
                            <Layer
                                id="swim-layer"
                                type="line"
                                filter={['==', 'type', 'swim']}
                                paint={{
                                    'line-color': '#00BFFF',
                                    'line-width': 2,
                                    'line-opacity': 0.8,
                                    'line-blur': 1
                                }}
                            />
                        </Source>
                    )}
                </Map>

                {/* HUD Overlays */}
                <div className="absolute top-4 left-4 p-4 bg-black/80 backdrop-blur-sm border border-neutral-800 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-3 h-3 text-neutral-500" />
                        <span className="text-[10px] text-neutral-400 tracking-widest">LIVE_TELEMETRY</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                        <div className="flex gap-2"><div className="w-2 h-2 bg-neon-orange mt-1"></div> <span>BIKE VECTORS</span></div>
                        <div className="flex gap-2"><div className="w-2 h-2 bg-neon-green mt-1"></div> <span>RUN VECTORS</span></div>
                        <div className="flex gap-2"><div className="w-2 h-2 bg-[#00BFFF] mt-1"></div> <span>SWIM VECTORS</span></div>
                    </div>
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-white/10"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-white/10"></div>

            </div>
        </section>
    );
}