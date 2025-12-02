import React, { useEffect } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

import BootSequence from './components/BootSequence';
import ConfirmationModal from './components/system/ConfirmationModal';
import LogBlueprintModal from './components/system/LogBlueprintModal';
import ParticleBackground from './components/effects/ParticleBackground';

import Navigation from './components/ui/Navigation';
import Garage from './components/sections/Garage';
import Roadmap from './components/sections/Roadmap';
import Analytics from './components/sections/Analytics';
import GlobalOps from './components/sections/GlobalOps';

import UploadModal from './components/modals/UploadModal';
import EditLogModal from './components/modals/EditLogModal';
import EditPhotoModal from './components/modals/EditPhotoModal';
import SyncModal from './components/modals/SyncModal';
import ImageViewModal from './components/modals/ImageViewModal';
import PinPadModal from './components/modals/PinPadModal';

import { useStore } from './store/useStore';
import { useNotification } from './contexts/NotificationContext';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- INITIALIZE APP ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app); // Export db for use in components

const INTERVALS_ATHLETE_ID = import.meta.env.VITE_INTERVALS_ATHLETE_ID;
const INTERVALS_API_KEY = import.meta.env.VITE_INTERVALS_API_KEY;
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function App() {
  const {
    user, setUser,
    setPortfolioItems, setTrainingLogs, setLoading,
    isBooting, setIsBooting,
    isUnlocked,
    modals, toggleModal, setConfirmationModal,
    selectedLog, setSelectedLog,
    wellnessLogs, setWellnessLogs
  } = useStore();

  const { addNotification } = useNotification();

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error(e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, [setUser]);

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    if (!user) return;

    const unsubGarage = onSnapshot(collection(db, 'garage_items'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPortfolioItems(items.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLoading(false);
    });

    const unsubTraining = onSnapshot(collection(db, 'ironman_logs'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrainingLogs(items.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const dateComparison = dateB.getTime() - dateA.getTime();
        if (dateComparison !== 0) return dateComparison;
        const createdAtA = a.createdAt?.toDate() || new Date(0);
        const createdAtB = b.createdAt?.toDate() || new Date(0);
        return createdAtB.getTime() - createdAtA.getTime();
      }));
    });

    const unsubWellness = onSnapshot(collection(db, 'daily_wellness'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWellnessLogs(items.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    return () => { unsubGarage(); unsubTraining(); unsubWellness(); };
  }, [user, setPortfolioItems, setTrainingLogs, setLoading, setWellnessLogs]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-300 font-mono selection:bg-neon-orange selection:text-black relative overflow-hidden">
      <div className="scanlines-global"></div>
      <ParticleBackground />
      {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}

      <Navigation />
      <PinPadModal />

      <div className="max-w-screen-2xl mx-auto">
        <Garage />
        <Roadmap />
        <Analytics />
        <GlobalOps />
      </div>

      {isUnlocked && (
        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={() => toggleModal('upload', !modals.upload)} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110">
            {modals.upload ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      )}

      <UploadModal />
      <EditLogModal />
      <EditPhotoModal />
      <SyncModal />
      <ImageViewModal />

      <ConfirmationModal
        isOpen={modals.confirmation.isOpen}
        title={modals.confirmation.title}
        message={modals.confirmation.message}
        onConfirm={modals.confirmation.onConfirm}
        onClose={() => setConfirmationModal({ isOpen: false })}
      />

      <LogBlueprintModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        athleteId={INTERVALS_ATHLETE_ID}
        apiKey={INTERVALS_API_KEY}
        mapboxToken={MAPBOX_ACCESS_TOKEN}
      />
    </div>
  );
}