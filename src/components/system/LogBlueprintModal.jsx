import React, { useState, useEffect } from 'react';
import { X, Map, Activity, Clock, TrendingUp, Waves, Bike, Dumbbell, Footprints } from 'lucide-react';
import { fetchActivityMap } from '../../api/intervals';
import { useNotification } from '../../contexts/NotificationContext';

const LogBlueprintModal = ({ log, onClose, athleteId, apiKey, mapboxToken }) => {
  const { addNotification } = useNotification();
  const [mapData, setMapData] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    setMapData(null); // Clear previous map data
    setLoadingMap(true);

    const loadMapData = async () => {
      // Only fetch map data for run, bike, and swim (outdoor) activities
      if (log.activityType === 'run' || log.activityType === 'bike' || log.activityType === 'swim') {
        try {
          const data = await fetchActivityMap(log.externalId, athleteId, apiKey);
          setMapData(data);
        } catch (error) {
          addNotification(`Failed to load map data for ${log.activityType} activity: ${error.message}`, 'error');
        }
      }
      setLoadingMap(false);
    };

    if (log && log.externalId && athleteId && apiKey) {
      loadMapData();
    } else {
      setLoadingMap(false); // No log or credentials, so no map to load
    }
  }, [log, athleteId, apiKey, addNotification]);

  if (!log) return null;

  const Icon = log.activityType === 'swim' ? Waves : log.activityType === 'bike' ? Bike : log.activityType === 'workout' ? Dumbbell : Footprints;

  return (
    <div className="fixed inset-0 z-[65] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12" onClick={onClose}>
      <div className="w-full max-w-5xl h-[85vh] bg-[#050505] border-2 border-neutral-800 flex flex-col md:flex-row relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-0 right-0 z-30 text-white hover:text-neon-orange bg-black p-4 border-b border-l border-neutral-800 hover:bg-neutral-900 transition-colors">
          <X className="w-6 h-6" />
        </button>

        {/* Left: Image / Map View */}
        <div className="w-full md:w-1/2 h-64 md:h-full shrink-0 bg-[#080808] relative flex items-center justify-center p-8 border-b-2 md:border-b-0 md:border-r-2 border-neutral-800">
          {log.url ? (
            <img src={log.url} className="max-h-full max-w-full object-contain" alt="Activity Log" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 border border-dashed border-neutral-800">
              <Map className="w-24 h-24 mb-4" />
              <span className="text-sm tracking-widest uppercase">NO VISUALS ATTACHED</span>
            </div>
          )}
          <div className="absolute top-4 left-4 text-[10px] text-neon-green font-mono tracking-widest bg-black px-2 py-1 border border-neon-green/30">LOG_ID: {log.id.slice(0, 8).toUpperCase()}</div>
        </div>

        {/* Right: Specs Panel */}
        <div className="w-full md:w-1/2 h-full p-8 font-mono text-neutral-400 flex flex-col relative z-10 bg-[#050505] overflow-y-auto">
          <div className="mb-8 border-b-2 border-neutral-800 pb-6">
            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">{log.activityType} Training</h3>
            <div className="text-xs text-neon-orange tracking-[0.2em] uppercase">{log.date}</div>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto">
            <div>
              <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">Log Entry</label>
              <p className="text-sm leading-relaxed text-neutral-300 border-l-2 border-neutral-800 pl-4">
                {log.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3" />Distance</label>
                <div className="text-lg font-bold text-white">{log.distance || 'N/A'} <span className="text-sm text-neutral-500">km</span></div>
              </div>
              <div>
                <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2 flex items-center gap-2"><Clock className="w-3 h-3" />Duration</label>
                <div className="text-lg font-bold text-white">{log.duration || 'N/A'} <span className="text-sm text-neutral-500">min</span></div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">Biometric Data</label>
              <Biometrics log={log} />
            </div>

            <div>
              <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">GPS Trace</label>
              <div className="aspect-video bg-[#080808] border border-neutral-900 p-2 flex items-center justify-center text-center relative overflow-hidden">
                {loadingMap ? (
                  <span className="text-neutral-500 text-xs animate-pulse">RETRIEVING MAP DATA...</span>
                ) : mapData && mapData.latlngs && mapData.latlngs.length > 0 ? (
                  <MapDisplay mapData={mapData} mapboxToken={mapboxToken} />
                ) : (
                  <span className="text-neutral-700 text-xs">[ No map data available ]</span>
                )}
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t-2 border-neutral-800">
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-2 h-2 bg-neon-green animate-blink"></div>
              <span className="text-[10px] tracking-widest">SECURE CONNECTION ESTABLISHED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapDisplay = ({ mapData, mapboxToken }) => {
  const { latlngs, bounds } = mapData;

  const MAP_WIDTH = 800; // Request a higher-res image
  const MAP_HEIGHT = 600;

  if (!mapboxToken) {
    // Fallback to only showing the trace if no token is provided
    return <MapTraceSVG latlngs={latlngs} bounds={bounds} />;
  }

  // Mapbox bounding box format is [minLng, minLat, maxLng, maxLat]
  const bbox = `[${bounds[0][1]},${bounds[0][0]},${bounds[1][1]},${bounds[1][0]}]`;
  const padding = 60; // Add 60px padding around the bounding box

  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${bbox}/${MAP_WIDTH}x${MAP_HEIGHT}?padding=${padding}&access_token=${mapboxToken}`;

  return (
    <div
      className="w-full h-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${mapUrl})` }}
    >
      <MapTraceSVG latlngs={latlngs} bounds={bounds} />
    </div>
  );
};

const MapTraceSVG = ({ latlngs, bounds }) => {
  const SVG_WIDTH = 400; // Adjusted for better aspect ratio in typical modals
  const SVG_HEIGHT = 300;

  if (!latlngs || latlngs.length === 0 || !bounds || bounds.length < 2) {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="bg-black/20">
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#555" fontSize="12">NO_TRACE_DATA</text>
      </svg>
    );
  }

  // Validate bounds structure
  if (!Array.isArray(bounds[0]) || !Array.isArray(bounds[1]) ||
    bounds[0].length < 2 || bounds[1].length < 2) {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="bg-black/20">
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#555" fontSize="12">INVALID_BOUNDS</text>
      </svg>
    );
  }

  // Bounds are [[minLat, minLng], [maxLat, maxLng]]
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;

  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  // Avoid division by zero
  if (latRange === 0 || lngRange === 0) {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="bg-black/20">
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#555" fontSize="12">POINT_DATA_ONLY</text>
      </svg>
    );
  }

  // Calculate scaling factors for both dimensions
  let scaleX = SVG_WIDTH / lngRange;
  let scaleY = SVG_HEIGHT / latRange;

  // Use the smaller scale to fit the entire trace, maintaining aspect ratio
  const scale = Math.min(scaleX, scaleY);

  // Calculate offsets to center the trace if one dimension is smaller
  const offsetX = (SVG_WIDTH - (lngRange * scale)) / 2;
  const offsetY = (SVG_HEIGHT - (latRange * scale)) / 2;


  // Convert lat/lng points to SVG x/y points, filtering out invalid entries
  const points = latlngs
    .filter(point => Array.isArray(point) && point.length >= 2 && typeof point[0] === 'number' && typeof point[1] === 'number')
    .map(([lat, lng]) => {
      // Invert Y-axis for SVG (top is 0, bottom is height)
      const x = (lng - minLng) * scale + offsetX;
      const y = SVG_HEIGHT - ((lat - minLat) * scale + offsetY); // Invert Y
      return `${x},${y}`;
    }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="bg-black/20 border border-neutral-800 rounded-sm">
      <polyline
        points={points}
        fill="none"
        stroke="#00FF41" // Neon green for the trace
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="drop-shadow-[0_0_5px_rgba(0,255,65,0.5)]" // Glow effect
      />
    </svg>
  );
};

const Biometrics = ({ log }) => {
  // --- Pace Calculation Helpers ---
  // Returns minutes per kilometer
  const getRunPace = (speed_ms) => {
    if (!speed_ms || speed_ms === 0) return null;
    const pace = 1000 / (speed_ms * 60); // decimal minutes per km
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Returns minutes per 100 meters
  const getSwimPace = (speed_ms) => {
    if (!speed_ms || speed_ms === 0) return null;
    const pace = 100 / (speed_ms * 60); // decimal minutes per 100m
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const metricBox = "text-xs space-y-2 text-neutral-400 font-mono border border-neutral-900 p-4 bg-[#080808]";
  const metricRow = "flex justify-between border-b border-neutral-900 pb-2";

  const renderMetric = (label, value, unit = '') => {
    // Don't render the row if the value is null or undefined
    if (value === null || typeof value === 'undefined') {
      return null;
    }
    return (
      <div key={label} className="flex justify-between border-b border-neutral-900 last:border-b-0 pb-2 last:pb-0">
        <span>{label}</span>
        <span className="text-white">{value} <span className="text-neutral-500">{unit}</span></span>
      </div>
    );
  }

  const metricsToRender = {
    bike: [
      renderMetric('AVG PACE', log.avgSpeed ? `${(log.avgSpeed * 3.6).toFixed(1)} km/h` : null),
      renderMetric('MAX POWER', log.maxPower, 'W'),
      renderMetric('AVG HEART RATE', log.avgHeartRate, 'BPM'),
      renderMetric('MAX HEART RATE', log.maxHeartRate, 'BPM'),
      renderMetric('ELEVATION GAIN', log.elevationGain, 'm'),
      renderMetric('AVG CADENCE', log.avgCadence, 'rpm'),
      renderMetric('TRAINING LOAD', log.trainingLoad),
      renderMetric('INTENSITY', log.intensity?.toFixed(1), '%'),
    ],
    run: [
      renderMetric('AVG PACE', getRunPace(log.avgSpeed), '/ km'),
      renderMetric('AVG HEART RATE', log.avgHeartRate, 'BPM'),
      renderMetric('MAX HEART RATE', log.maxHeartRate, 'BPM'),
      renderMetric('ELEVATION GAIN', log.elevationGain, 'm'),
      renderMetric('AVG CADENCE', log.avgCadence, 'rpm'),
      renderMetric('TRAINING LOAD', log.trainingLoad),
      renderMetric('INTENSITY', log.intensity?.toFixed(1), '%'),
    ],
    swim: [
      renderMetric('AVG PACE', getSwimPace(log.avgSpeed), '/ 100m'),
      renderMetric('AVG HEART RATE', log.avgHeartRate, 'BPM'),
      renderMetric('MAX HEART RATE', log.maxHeartRate, 'BPM'),
      renderMetric('TRAINING LOAD', log.trainingLoad),
      renderMetric('INTENSITY', log.intensity?.toFixed(1), '%'),
    ],
    workout: [
      renderMetric('DURATION', log.duration, 'min'),
      renderMetric('AVG HEART RATE', log.avgHeartRate, 'BPM'),
      renderMetric('MAX HEART RATE', log.maxHeartRate, 'BPM'),
      renderMetric('TRAINING LOAD', log.trainingLoad),
      renderMetric('INTENSITY', log.intensity?.toFixed(1), '%'),
    ]
  };

  const activityMetrics = metricsToRender[log.activityType]?.filter(Boolean);

  if (!activityMetrics || activityMetrics.length === 0) {
    return (
      <div className={metricBox}>
        <p className="text-center text-neutral-700 text-xs">[ No biometric data available ]</p>
      </div>
    );
  }

  return (
    <div className={metricBox}>
      {activityMetrics}
    </div>
  );
}

export default LogBlueprintModal;
