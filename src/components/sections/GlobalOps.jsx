import React, { useState, useEffect, useRef, useMemo } from 'react';
// For mapbox-gl v3+
import Map, { Source, Layer } from "react-map-gl/mapbox";
import { Globe, Terminal, Crosshair, Waves, Bike, Footprints } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../App';

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
    const [selectedActivity, setSelectedActivity] = useState(null);
    const mapRef = useRef();

    // Load the GeoJSON from Firestore
    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const docRef = doc(db, 'mission_data', 'paths');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Parse the stringified GeoJSON
                    const geoJSON = JSON.parse(data.geoJSONString);
                    setMapData(geoJSON);
                    console.log(`🗺️ Map Loaded from Firestore: ${data.totalPaths} paths`);
                } else {
                    console.warn("Map data not found in Firestore, trying static file...");
                    // Fallback to static file
                    const res = await fetch(`/mission_paths.json?t=${Date.now()}`);
                    const staticData = await res.json();
                    setMapData(staticData);
                    console.log(`🗺️ Map Loaded from static file: ${staticData.features?.length} paths`);
                }
            } catch (err) {
                console.error("Firestore Map Fetch Error:", err);
                // Fallback to static file on error
                try {
                    const res = await fetch(`/mission_paths.json?t=${Date.now()}`);
                    const staticData = await res.json();
                    setMapData(staticData);
                    console.log(`🗺️ Map Loaded from static fallback: ${staticData.features?.length} paths`);
                } catch (fallbackErr) {
                    console.error("Static file fallback also failed:", fallbackErr);
                }
            }
        };

        fetchMapData();
    }, []);



    // Get activity list from GeoJSON features
    const activityList = useMemo(() => {
        if (!mapData?.features) return [];
        return mapData.features
            .filter(f => f.properties?.name)
            .slice(0, 8) // Limit to 8 activities
            .map(f => ({
                id: f.properties.id || f.properties.name,
                name: f.properties.name,
                type: f.properties.type,
                date: f.properties.date,
                coordinates: f.geometry?.coordinates?.[0] || [58.4, 23.6] // First coordinate point
            }));
    }, [mapData]);

    // FlyTo target acquisition
    const handleActivitySelect = (activity) => {
        setSelectedActivity(activity.id);

        if (mapRef.current) {
            const coords = activity.coordinates;
            mapRef.current.flyTo({
                center: Array.isArray(coords[0]) ? coords : coords,
                zoom: 13,
                duration: 2000,
                pitch: 45,
                bearing: 30
            });
        }

    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'swim': return <Waves className="w-3 h-3 text-[#00BFFF]" />;
            case 'bike': return <Bike className="w-3 h-3 text-neon-orange" />;
            case 'run': return <Footprints className="w-3 h-3 text-neon-green" />;
            default: return <Crosshair className="w-3 h-3 text-neutral-500" />;
        }
    };

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

            {/* Map + Activity Selector Layout */}
            <div className="flex flex-col lg:flex-row gap-4">

                {/* Activity Selector Panel */}
                {activityList.length > 0 && (
                    <div className="lg:w-64 bg-[#0a0a0a] border border-neutral-800 p-3 order-2 lg:order-1">
                        <div className="flex items-center gap-2 mb-3 text-[10px] text-neutral-500 uppercase tracking-widest">
                            <Crosshair className="w-3 h-3" />
                            TARGET ACQUISITION
                        </div>
                        <div className="space-y-1 max-h-[500px] overflow-y-auto">
                            {activityList.map((activity) => (
                                <button
                                    key={activity.id}
                                    onClick={() => handleActivitySelect(activity)}
                                    className={`w-full text-left p-2 border transition-all text-xs font-mono ${selectedActivity === activity.id
                                        ? 'border-neon-orange bg-orange-900/20 target-acquired'
                                        : 'border-neutral-800 hover:border-neutral-600 bg-black/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {getActivityIcon(activity.type)}
                                        <span className="text-neutral-400 truncate flex-1">
                                            {activity.name?.slice(0, 25) || 'Unknown'}
                                        </span>
                                    </div>
                                    {activity.date && (
                                        <div className="text-[9px] text-neutral-600 mt-1 pl-5">
                                            {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* The Map Container */}
                <div className="flex-1 h-[600px] border border-neutral-800 rounded-lg overflow-hidden relative group order-1 lg:order-2 bg-neutral-900">

                    <Map
                        {...viewState}
                        onMove={evt => {
                            setViewState(evt.viewState);
                        }}
                        style={{ width: '100%', height: '100%' }}
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
            </div>
        </section>
    );
}
