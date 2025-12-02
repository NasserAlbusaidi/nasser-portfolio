import 'dotenv/config';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- CONFIG ---
const OUTPUT_FILE = './public/mission_paths.json';
const CACHE_FILE = './scripts/map-cache.json';
const API_KEY = process.env.VITE_INTERVALS_API_KEY;

// --- CHECK ENV ---
if (!API_KEY) {
    console.error("❌ ERROR: VITE_INTERVALS_API_KEY is missing.");
    process.exit(1);
}

// --- INIT FIREBASE ---
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

try { initializeApp({ credential: cert(serviceAccount) }); } catch(e) {}
const db = getFirestore();

// --- API HELPER ---
const fetchActivityMap = async (activityId) => {
    const auth = Buffer.from(`API_KEY:${API_KEY}`).toString('base64');
    const url = `https://intervals.icu/api/v1/activity/${activityId}/map`;
    
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Basic ${auth}` } });
        if (!res.ok) return null;
        
        const json = await res.json();
        
        // Return valid coordinates if they exist
        if (json && json.latlngs && json.latlngs.length > 0) {
            return json.latlngs;
        }
        return null;
    } catch (e) {
        return null;
    }
};

// --- COORDINATE PROCESSOR ---
const processCoordinates = (coords) => {
    if (!Array.isArray(coords)) return [];
    
    const valid = [];
    // Optimization: Keep every 5th point to reduce file size (adjustable)
    for (let i = 0; i < coords.length; i += 5) {
        const p = coords[i];
        
        // Handle [lat, lng] array format (Intervals default)
        if (Array.isArray(p) && p.length >= 2) {
            // Mapbox expects [Longitude, Latitude], Intervals gives [Lat, Lng]
            valid.push([p[1], p[0]]); 
        } 
        // Handle {lat, lng} object format (Just in case)
        else if (p && typeof p === 'object') {
            const lat = p.lat || p[0];
            const lng = p.lng || p.lon || p[1];
            if (lat && lng) valid.push([lng, lat]);
        }
    }
    return valid;
};

const run = async () => {
    console.log("🌍 Starting Global Ops Map Sync...");

    // 1. Load Cache (Prevents re-downloading existing maps)
    let cache = {};
    if (fs.existsSync(CACHE_FILE)) {
        try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) {}
    }

    // 2. Scan Firestore
    console.log("🔥 Scanning Firestore...");
    const logs = await db.collection('ironman_logs').get();
    
    let queue = [];
    logs.forEach(doc => {
        const data = doc.data();
        // Use externalId or id, prioritizing externalId as per your DB structure
        let rawId = data.externalId || data.id;
        
        if (rawId && (data.activityType === 'bike' || data.activityType === 'run')) {
            queue.push({ id: String(rawId), type: data.activityType });
        }
    });

    console.log(`📂 Found ${queue.length} activities.`);

    // 3. Process Queue
    let newCount = 0;
    const features = [];
    let successCount = 0;

    for (const act of queue) {
        let coords = cache[act.id];

        // Fetch if not in cache
        if (!coords) {
            process.stdout.write(`   ⬇️  Downloading ${act.type} ${act.id}... `);
            const rawMapData = await fetchActivityMap(act.id);
            
            if (rawMapData) {
                coords = processCoordinates(rawMapData);
                if (coords.length > 0) {
                    console.log(`✅ OK (${coords.length} pts)`);
                    cache[act.id] = coords;
                    newCount++;
                } else {
                    console.log(`⚠️ Bad Format`);
                }
            } else {
                console.log(`❌ No Map Data`);
            }
            // Be nice to the API rate limits
            await new Promise(r => setTimeout(r, 200));
        }

        // Add to GeoJSON
        if (coords && coords.length > 0) {
            features.push({
                type: "Feature",
                properties: { type: act.type, id: act.id },
                geometry: { type: "LineString", coordinates: coords }
            });
            successCount++;
        }
    }

    // 4. Save Updates
    if (newCount > 0) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
        console.log(`\n💾 Cache updated with ${newCount} new traces.`);
    }

    const geoJSON = { type: "FeatureCollection", features: features };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geoJSON));

    console.log(`\n🎉 DONE! Generated ${successCount} paths in ${OUTPUT_FILE}`);
    process.exit(0);
};

run();