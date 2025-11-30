import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Setup Environment
const ATHLETE_ID = process.env.VITE_INTERVALS_ATHLETE_ID ? process.env.VITE_INTERVALS_ATHLETE_ID.trim() : null;
const API_KEY = process.env.VITE_INTERVALS_API_KEY ? process.env.VITE_INTERVALS_API_KEY.trim() : null;
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

// --- CREDENTIAL DIAGNOSTICS ---
console.log("\n🔍 --- CONFIG CHECK ---");
if (API_KEY) {
    const start = API_KEY.substring(0, 3);
    const end = API_KEY.substring(API_KEY.length - 3);
    console.log(`🔑 API Key: ${start}......${end} (Length: ${API_KEY.length})`);
    console.log(`👤 Athlete ID: ${ATHLETE_ID}`);
} else {
    console.error("❌ API_KEY is MISSING in Environment");
}
console.log("---------------------------\n");

if (!ATHLETE_ID || !API_KEY || !SERVICE_ACCOUNT) {
    console.error("❌ Critical: Missing Secrets.");
    process.exit(1);
}

// 2. Initialize Firebase
try {
    initializeApp({
        credential: cert(SERVICE_ACCOUNT)
    });
} catch (error) {
    console.error("❌ Firebase Init Failed:", error.message);
    process.exit(1);
}

const db = getFirestore();

// 3. API Helper
const fetchIntervals = async (endpoint) => {
    // CORRECTED AUTH FORMAT: username = API_KEY, password = empty
    // Matches curl -u "KEY:"
    const authString = `${API_KEY}:`;
    const auth = Buffer.from(authString).toString('base64');

    const url = endpoint.startsWith('http')
        ? endpoint
        : `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}${endpoint}`;

    const headers = {
        'Authorization': `Basic ${auth}`,
        // User-Agent is often required to avoid "bot" blocking on servers
        'User-Agent': 'NasserPortfolio-Sync/1.0 (GitHub Actions)'
    };

    console.log(`📡 Requesting: ${url}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 403) {
            const text = await response.text();
            console.error(`\n⛔ 403 FORBIDDEN DETECTED`);
            console.error(`This usually means the API Key is valid, but the SERVER IP is blocked.`);
            console.error(`ACTION REQUIRED: Go to Intervals.icu -> Settings -> API -> Enable "Allow API access from servers"\n`);
            throw new Error(`403 Forbidden: ${text}`);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

const run = async () => {
    console.log("🚀 Starting Sync Job...");

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 7);
    const afterDate = lookbackDate.toISOString().split('T')[0];

    try {
        const batch = db.batch();
        let opCount = 0;

        // --- TEST CONNECTION FIRST (Who Am I?) ---
        console.log("qm  Verifying Access...");
        // We check /athlete/current to verify the key works and IP is allowed
        const me = await fetchIntervals('https://intervals.icu/api/v1/athlete/current');
        console.log(`✅ Authenticated as: ${me.id} (${me.name})`);

        if (me.id !== ATHLETE_ID) {
            console.warn(`⚠️ WARNING: Configured Athlete ID (${ATHLETE_ID}) does not match API Key Owner (${me.id})`);
        }

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

        // --- SYNC ACTIVITIES ---
        console.log("cYcLe: Fetching Activities...");
        const activities = await fetchIntervals(`/activities?oldest=${afterDate}&limit=50`);
        const ALLOWED = ['Ride', 'Run', 'Swim', 'WeightTraining'];

        if (Array.isArray(activities)) {
            activities.forEach(act => {
                if (!ALLOWED.includes(act.type)) return;

                const docRef = db.collection('ironman_logs').doc(String(act.id));
                let activityType = 'run';
                if (act.type === 'Ride') activityType = 'bike';
                if (act.type === 'Swim') activityType = 'swim';
                if (act.type === 'WeightTraining') activityType = 'workout';

                batch.set(docRef, {
                    externalId: String(act.id),
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
                }, { merge: true });
                opCount++;
            });
        }

        if (opCount > 0) {
            await batch.commit();
            console.log(`✅ Sync Complete. Updated ${opCount} records.`);
        } else {
            console.log("✅ No new data to sync.");
        }

        process.exit(0);

    } catch (error) {
        console.error("❌ Sync Failed:", error.message);
        process.exit(1);
    }
};

run();