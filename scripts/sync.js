import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. Setup Environment (Added .trim() to clean inputs)
const ATHLETE_ID = process.env.VITE_INTERVALS_ATHLETE_ID ? process.env.VITE_INTERVALS_ATHLETE_ID.trim() : null;
const API_KEY = process.env.VITE_INTERVALS_API_KEY ? process.env.VITE_INTERVALS_API_KEY.trim() : null;

// The service account is a JSON string, so we don't trim it, but we parse it carefully
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

if (!ATHLETE_ID || !API_KEY || !SERVICE_ACCOUNT) {
    console.error("❌ Missing Environment Variables.");
    // Debug log to see which one is missing (Masked for security)
    console.log(`ATHLETE_ID: ${ATHLETE_ID ? 'SET' : 'MISSING'}`);
    console.log(`API_KEY: ${API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`SERVICE_ACCOUNT: ${SERVICE_ACCOUNT ? 'SET' : 'MISSING'}`);
    process.exit(1);
}

// 2. Initialize Firebase Admin
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
    // Ensure strict Basic Auth format: "API_KEY:your_actual_key"
    const authString = `API_KEY:${API_KEY}`;
    const auth = Buffer.from(authString).toString('base64');

    const url = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}${endpoint}`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!response.ok) {
        // Enhanced error logging
        if (response.status === 403) {
            throw new Error(`Forbidden (403): Check API_KEY permissions or ATHLETE_ID match. Target: ${ATHLETE_ID}`);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
};

const run = async () => {
    console.log("🚀 Starting Sync Job...");
    console.log(`👤 Target Athlete: ${ATHLETE_ID}`);

    // Look back 7 days
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 7);
    const afterDate = lookbackDate.toISOString().split('T')[0];

    try {
        const batch = db.batch();
        let opCount = 0;

        // --- SYNC WELLNESS ---
        console.log("🧬 Fetching Wellness Data...");
        const wellnessData = await fetchIntervals(`/wellness?oldest=${afterDate}`);

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

        // --- SYNC ACTIVITIES ---
        console.log("cYcLe: Fetching Activities...");
        const activities = await fetchIntervals(`/activities?oldest=${afterDate}&limit=50`);
        const ALLOWED = ['Ride', 'Run', 'Swim', 'WeightTraining'];

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