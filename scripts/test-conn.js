import 'dotenv/config';

// 1. Get Config
const API_KEY = process.env.VITE_INTERVALS_API_KEY;
const TEST_ID = "109410090"; // Extracted from your "i109410090"

console.log("------------------------------------------------");
console.log("📡 INTERVALS.ICU CONNECTION TEST");
console.log("------------------------------------------------");

if (!API_KEY) {
    console.error("❌ FATAL: VITE_INTERVALS_API_KEY is not found in .env file");
    process.exit(1);
}
console.log(`🔑 API Key loaded: ${API_KEY.slice(0, 5)}...`);

async function test() {
    // 2. Prepare Request
    const auth = Buffer.from(`API_KEY:${API_KEY}`).toString('base64');
    const url = `https://intervals.icu/api/v1/activity/${TEST_ID}/streams?keys=latlng`;

    console.log(`🌐 Requesting: ${url}`);

    try {
        const res = await fetch(url, { 
            headers: { 'Authorization': `Basic ${auth}` } 
        });

        console.log(`STATUS CODE: ${res.status} ${res.statusText}`);

        if (res.status === 401) {
            console.error("\n❌ ERROR: 401 Unauthorized.");
            console.error("   -> Your API Key is invalid or expired.");
            console.error("   -> Go to Intervals.icu > Settings > Developer and regenerate it.");
        } 
        else if (res.status === 403) {
            console.error("\n❌ ERROR: 403 Forbidden.");
            console.error("   -> This activity is private.");
            console.error("   -> Intervals.icu > Settings > Privacy > Uncheck 'Private' or allow API access.");
        }
        else if (res.status === 404) {
            console.error("\n❌ ERROR: 404 Not Found.");
            console.error("   -> The ID " + TEST_ID + " does not exist.");
        }
        else if (res.ok) {
            const json = await res.json();
            const stream = json.find(s => s.type === 'latlng');
            if (stream) {
                console.log(`\n✅ SUCCESS! Downloaded ${stream.data.length} GPS points.`);
                console.log("   -> Your API Key works.");
                console.log("   -> Your Data exists.");
            } else {
                console.log("\n⚠️ SUCCESS, but no GPS data found in this activity.");
                console.log("   -> Is this an indoor ride?");
            }
        } else {
            console.log("\n❌ UNKNOWN ERROR:", await res.text());
        }

    } catch (error) {
        console.error("❌ NETWORK ERROR:", error.message);
    }
}

test();