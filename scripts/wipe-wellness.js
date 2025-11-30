import 'dotenv/config';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load Service Account
let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const wipe = async () => {
    console.log("🧹 Wiping 'daily_wellness' collection...");
    const snapshot = await db.collection('daily_wellness').get();

    if (snapshot.empty) {
        console.log("✅ Collection already empty.");
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✨ Deleted ${snapshot.size} records. Clean slate.`);
};

wipe();