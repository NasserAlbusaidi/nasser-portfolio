import 'dotenv/config';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- CONFIG ---
const CACHE_FILE = './scripts/map-cache.json';
const API_KEY = process.env.VITE_INTERVALS_API_KEY;

// --- CHECK ENV ---
if (!API_KEY) {
    console.error("❌ ERROR: VITE_INTERVALS_API_KEY is missing.");
    process.exit(1);
}

// --- INIT FIREBASE ---
let serviceAccount;
try {
    serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
} catch (e) {
    console.error("❌ Service Account Error:", e.message);
    process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// --- API HELPER ---
const fetchActivityMap = async (activityId) => {
    const auth = Buffer.from(`API_KEY:${API_KEY}`).toString('base64');
    const url = `https://intervals.icu/api/v1/activity/${activityId}/map`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `Basic ${auth}` } });
        if (!res.ok) return null;

        const json = await res.json();
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
    // Keep every 5th point to reduce file size
    for (let i = 0; i < coords.length; i += 5) {
        const p = coords[i];
        // Handle [lat, lng] array (Intervals default) -> Convert to [lng, lat] for Mapbox
        if (Array.isArray(p) && p.length >= 2) {
            valid.push([p[1], p[0]]);
        }
        // Handle {lat, lng} object
        else if (p && typeof p === 'object') {
            const lat = p.lat || p[0];
            const lng = p.lng || p.lon || p[1];
            if (lat && lng) valid.push([lng, lat]);
        }
    }
    return valid;
};

const run = async () => {
    console.log("🌍 GLOBAL OPS: Map Sync Sequence Initiated...");
    console.log("📡 Mode: FIRESTORE DIRECT (No rebuild required!)");

    // 1. Load Cache
    let cache = {};
    if (fs.existsSync(CACHE_FILE)) {
        try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) { }
    }

    // 2. Scan Firestore (The Source of Truth)
    console.log("🔥 Scanning Firestore for Active Operations...");
    const logs = await db.collection('ironman_logs').get();

    let dbActivities = [];
    logs.forEach(doc => {
        const data = doc.data();
        const rawId = data.externalId || data.id; // Handle both formats
        if (rawId && (data.activityType === 'bike' || data.activityType === 'run' || data.activityType === 'swim')) {
            dbActivities.push({ id: String(rawId), type: data.activityType });
        }
    });

    console.log(`📂 Database holds ${dbActivities.length} mappable missions.`);
    console.log(`   IDs in DB: [${dbActivities.map(a => a.id).join(', ')}]`);
    console.log(`   IDs in Cache: [${Object.keys(cache).join(', ')}]`);

    // 3. "Deep Check" - Find Missing Plots
    const missingFromCache = dbActivities.filter(act => !cache[act.id]);

    if (missingFromCache.length > 0) {
        console.log(`⚠️ DETECTED ${missingFromCache.length} MISSING PLOTS. INITIATING RETRIEVAL...`);

        let fetchedCount = 0;
        for (const act of missingFromCache) {
            process.stdout.write(`   ⬇️  Downloading ${act.type} [${act.id}]... `);

            const rawMapData = await fetchActivityMap(act.id);

            if (rawMapData) {
                const coords = processCoordinates(rawMapData);
                if (coords.length > 0) {
                    cache[act.id] = coords;
                    fetchedCount++;
                    console.log(`✅ OK (${coords.length} pts)`);
                } else {
                    console.log(`⚠️ Invalid Data`);
                }
            } else {
                console.log(`❌ No Map Found (Indoor?)`);
            }

            // Rate Limit safety
            await new Promise(r => setTimeout(r, 250));
        }

        if (fetchedCount > 0) {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
            console.log(`💾 Local Cache Updated: +${fetchedCount} new traces.`);
        }
    } else {
        console.log("✅ All missions accounted for. Cache is synced.");
    }

    // 4. Build GeoJSON and Write to Firestore
    console.log("🗺️  Assembling GeoJSON for Firestore...");
    const features = [];
    let totalPoints = 0;

    for (const act of dbActivities) {
        const coords = cache[act.id];
        if (coords && coords.length > 0) {
            features.push({
                type: "Feature",
                properties: { type: act.type, id: act.id },
                geometry: { type: "LineString", coordinates: coords }
            });
            totalPoints += coords.length;
        }
    }

    const geoJSON = { type: "FeatureCollection", features: features };

    // 5. Write to Firestore (single document)
    console.log("🔥 Uploading to Firestore...");
    await db.collection('mission_data').doc('paths').set({
        geoJSON: geoJSON,
        totalPaths: features.length,
        totalPoints: totalPoints,
        updatedAt: new Date()
    });

    console.log(`🎉 OPERATION COMPLETE.`);
    console.log(`   > Total Paths: ${features.length}`);
    console.log(`   > Total Points: ${totalPoints}`);
    console.log(`   > Destination: Firestore (mission_data/paths)`);

    process.exit(0);
};

run();