import 'dotenv/config';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { execSync } from 'child_process';

// 1. Setup Environment
let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

if (!serviceAccount) {
    try {
        if (fs.existsSync('./service-account.json')) {
            const rawData = fs.readFileSync('./service-account.json', 'utf8');
            serviceAccount = JSON.parse(rawData);
            console.log("📂 Loaded Service Account from './service-account.json'");
        }
    } catch (e) {
        console.warn("⚠️ Could not load local service account file.");
    }
}

const ATHLETE_ID = process.env.VITE_INTERVALS_ATHLETE_ID ? process.env.VITE_INTERVALS_ATHLETE_ID.trim() : null;
const API_KEY = process.env.VITE_INTERVALS_API_KEY ? process.env.VITE_INTERVALS_API_KEY.trim() : null;
const MAP_CACHE_FILE = './scripts/map-cache.json'; // <--- LOAD CACHE FILE PATH

// --- CREDENTIAL DIAGNOSTICS ---
console.log("\n🔍 --- CONFIG CHECK ---");
if (API_KEY) {
    const start = API_KEY.substring(0, 3);
    const end = API_KEY.substring(API_KEY.length - 3);
    console.log(`🔑 API Key: ${start}......${end} (Length: ${API_KEY.length})`);
} else {
    console.error("❌ API_KEY is MISSING");
}

if (serviceAccount) {
    console.log("🔐 Service Account: LOADED");
} else {
    console.error("❌ Service Account is MISSING (Env or File)");
}
console.log(`👤 Athlete ID: ${ATHLETE_ID || 'MISSING'}`);
console.log("---------------------------\n");

if (!ATHLETE_ID || !API_KEY || !serviceAccount) {
    console.error("❌ Critical: Missing Secrets.");
    process.exit(1);
}

// 2. Initialize Firebase
try {
    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (error) {
    console.error("❌ Firebase Init Failed:", error.message);
    process.exit(1);
}

const db = getFirestore();

// 3. API Helper
const fetchIntervals = async (endpoint) => {
    const authString = `API_KEY:${API_KEY}`;
    const auth = Buffer.from(authString).toString('base64');

    const url = endpoint.startsWith('http')
        ? endpoint
        : `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}${endpoint}`;

    const headers = {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'NasserPortfolio-Sync/1.0'
    };

    console.log(`📡 Requesting: ${url}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 403) {
            const text = await response.text();
            console.error(`\n⛔ 403 FORBIDDEN. Server says: ${text}`);
            throw new Error(`403 Forbidden`);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

const run = async () => {
    console.log("🚀 Starting Sync Job...");

    // Look back 30 days for wellness
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 30);
    const afterDate = lookbackDate.toISOString().split('T')[0];

    // <--- 1. LOAD MAP CACHE (To check for missing plots) --->
    let mapCache = {};
    if (fs.existsSync(MAP_CACHE_FILE)) {
        try { mapCache = JSON.parse(fs.readFileSync(MAP_CACHE_FILE, 'utf8')); } catch (e) { }
    }

    try {
        const batch = db.batch();
        let opCount = 0;
        let pendingMapSync = false; // Flag to trigger map sync

        // --- TEST ACCESS ---
        await fetchIntervals('/wellness?oldest=' + new Date().toISOString().split('T')[0]);
        console.log("✅ API Connection Verified");

        // --- SYNC WELLNESS ---
        console.log("🧬 Fetching Wellness Data...");
        const wellnessData = await fetchIntervals(`/wellness?oldest=${afterDate}`);

        if (Array.isArray(wellnessData)) {
            wellnessData.forEach(day => {
                if (day.id) {
                    const docRef = db.collection('daily_wellness').doc(`wellness_${day.id}`);
                    batch.set(docRef, {
                        date: day.id,
                        restingHR: day.restingHR || null,
                        steps: day.steps || 0,
                        sleepSecs: day.sleepSecs || null,
                        spO2: day.spO2 || null,
                        hrv: day.hrv || null,
                        weight: day.weight || null,
                        updatedAt: new Date()
                    }, { merge: true });
                    opCount++;
                }
            });
        }

        // --- SYNC ACTIVITIES (With De-Duplication) ---
        console.log("cYcLe: Fetching Activities...");

        const existingLogsSnapshot = await db.collection('ironman_logs').select('externalId').get();
        const existingLogsMap = new Map();

        existingLogsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.externalId) {
                existingLogsMap.set(String(data.externalId), doc.id);
            }
        });
        console.log(`📂 Found ${existingLogsMap.size} existing logs in database.`);

        // <--- 2. FIXED DATE: Start from Nov 20, 2025 to catch "yesterday's run" --->
        const activitiesDateStart = '2025-11-20';

        const activities = await fetchIntervals(`/activities?oldest=${activitiesDateStart}&limit=50`);
        const ALLOWED = ['Ride', 'Run', 'Swim', 'WeightTraining'];

        if (Array.isArray(activities)) {
            activities.forEach(act => {
                if (!ALLOWED.includes(act.type)) return;

                const externalId = String(act.id);
                let docRef;
                let isNew = false;

                if (existingLogsMap.has(externalId)) {
                    // It exists in DB
                    const docId = existingLogsMap.get(externalId);
                    docRef = db.collection('ironman_logs').doc(docId);
                } else {
                    // It is NEW
                    docRef = db.collection('ironman_logs').doc();
                    isNew = true;
                }

                let activityType = 'run';
                if (act.type === 'Ride') activityType = 'bike';
                if (act.type === 'Swim') activityType = 'swim';
                if (act.type === 'WeightTraining') activityType = 'workout';

                // <--- 3. MAP CHECK LOGIC --->
                // If it's a Bike/Run, we check if we have the map.
                if (activityType === 'bike' || activityType === 'run') {
                    // Check our local cache file
                    const hasMap = mapCache[externalId];

                    if (isNew) {
                        console.log(`✨ New Activity detected (${activityType} - ${act.start_date_local}). Queueing Map Sync.`);
                        pendingMapSync = true;
                    }
                    else if (!hasMap) {
                        console.log(`⚠️  Existing Activity (${externalId}) missing from map cache. Queueing Map Sync.`);
                        pendingMapSync = true;
                    }
                }

                const payload = {
                    externalId,
                    activityType,
                    distance: (act.distance / 1000).toFixed(2),
                    duration: Math.round(act.moving_time / 60),
                    date: act.start_date_local.split('T')[0],
                    description: act.name,
                    source: 'intervals.icu',
                    avgHeartRate: act.average_heartrate || null,
                    maxPower: act.icu_pm_p_max || null,
                    avgSpeed: act.average_speed || null,
                    elevationGain: act.total_elevation_gain || null,
                    avgCadence: act.average_cadence || null,
                    maxHeartRate: act.max_heartrate || null,
                    trainingLoad: act.icu_training_load || null,
                    intensity: act.icu_intensity || null,
                    updatedAt: new Date()
                };

                if (isNew) {
                    payload.createdAt = new Date();
                }

                batch.set(docRef, payload, { merge: true });
                opCount++;
            });
        }

        if (opCount > 0) {
            await batch.commit();
            console.log(`✅ Sync Complete. Updated/Created ${opCount} records.`);
        } else {
            console.log("✅ No new metadata to sync.");
        }

        // <--- 4. TRIGGER MAP SYNC IF REQUIRED --->
        if (pendingMapSync) {
            console.log(`\n🗺️  Map updates required.`);
            console.log("🔄 Triggering scripts/map-sync.js...");
            try {
                // Execute the map script
                execSync('node scripts/map-sync.js', { stdio: 'inherit' });
            } catch (err) {
                console.error("❌ Map Sync encountered an error.");
            }
        } else {
            console.log("⏩ All maps accounted for. Skipping map sync.");
        }

        process.exit(0);

    } catch (error) {
        console.error("❌ Sync Failed:", error.message);
        process.exit(1);
    }
};

run();