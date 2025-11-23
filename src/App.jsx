import React, { useState, useEffect, useMemo } from 'react';
import { History, Hammer, Trash2, Lock, Unlock, Save, KeyRound, Upload, Loader2, Activity, Waves, Bike, Footprints, Flag, MapPin, ChevronDown, RefreshCw, X, Plus } from 'lucide-react';
import BootSequence from './components/BootSequence';
import { fetchActivities, processActivities } from './api/intervals';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCa3KRBnOQRZvfuXchd2ve5kSUnJ-SSlBI",
  authDomain: "nasser-portfolio.firebaseapp.com",
  projectId: "nasser-portfolio",
  storageBucket: "nasser-portfolio.firebasestorage.app",
  messagingSenderId: "473987777878",
  appId: "1:473987777878:web:81d915caab393d329982f7",
  measurementId: "G-HL7ZH6F026"
};

// --- INITIALIZE APP ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONSTANTS ---
const CATEGORIES = ["All", "Landscape", "Portrait", "Street", "Workout", "Events", "Misc"];
const ACCESS_PIN = import.meta.env.VITE_ACCESS_PIN;
const IRONMAN_DATE = new Date(import.meta.env.VITE_IRONMAN_DATE); // Feb 14, 2026
const TARGETS = {
  swim: Number(import.meta.env.VITE_TARGET_SWIM),
  bike: Number(import.meta.env.VITE_TARGET_BIKE),
  run: Number(import.meta.env.VITE_TARGET_RUN)
};
const INTERVALS_ATHLETE_ID = import.meta.env.VITE_INTERVALS_ATHLETE_ID;
const INTERVALS_API_KEY = import.meta.env.VITE_INTERVALS_API_KEY;

export default function App() {
  // Navigation State
  const [filter, setFilter] = useState("All");

  // Data State
  const [selectedImage, setSelectedImage] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBooting, setIsBooting] = useState(true);

  // Auth & Admin State
  const [user, setUser] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [showPinPad, setShowPinPad] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("training"); // 'portfolio' or 'training'
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    filename: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    category: 'Street',
    location: '',
    description: '',
    rotation: 'rotate-0',
    activityType: 'run',
    distance: 0,
    duration: ''
  });

  // Sync State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    athleteId: import.meta.env.VITE_INTERVALS_ATHLETE_ID || localStorage.getItem('intervals_athlete_id') || '',
    apiKey: import.meta.env.VITE_INTERVALS_API_KEY || localStorage.getItem('intervals_api_key') || '',
    afterDate: new Date().toISOString().split('T')[0]
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error(e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 2. DATA FETCHING ---
  useEffect(() => {
    if (!user) return;

    // Fetch Portfolio
    const unsubGarage = onSnapshot(collection(db, 'garage_items'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPortfolioItems(items.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLoading(false);
    });

    // Fetch Training Logs
    const unsubTraining = onSnapshot(collection(db, 'ironman_logs'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrainingLogs(items.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    return () => { unsubGarage(); unsubTraining(); };
  }, [user]);

  // --- 3. HELPERS ---
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
      reader.onerror = reject;
    });
  };

  const calculateTotals = () => {
    return trainingLogs.reduce((acc, log) => {
      const dist = parseFloat(log.distance) || 0;
      if (log.activityType === 'swim') acc.swim += dist;
      if (log.activityType === 'bike') acc.bike += dist;
      if (log.activityType === 'run') acc.run += dist;
      return acc;
    }, { swim: 0, bike: 0, run: 0 });
  };

  const getTimeUntilRace = () => {
    const now = new Date();
    const diff = IRONMAN_DATE - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // --- 4. HANDLERS ---
  const handleSecretTrigger = () => {
    if (isUnlocked) return;
    setClickCount(prev => {
      if (prev + 1 === 3) { setShowPinPad(true); return 0; }
      return prev + 1;
    });
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === ACCESS_PIN) { setIsUnlocked(true); setShowPinPad(false); setPinInput(""); }
    else { alert("INVALID_ACCESS_CODE"); setPinInput(""); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user || !isUnlocked) return;
    setIsUploading(true);

    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await compressImage(imageFile);
      }

      const collectionName = uploadType === 'portfolio' ? 'garage_items' : 'ironman_logs';

      await addDoc(collection(db, collectionName), {
        ...newItem,
        url: imageUrl,
        createdAt: serverTimestamp()
      });

      alert("Entry committed.");
      setNewItem(prev => ({ ...prev, filename: '', description: '', distance: 0 }));
      setImageFile(null);
      setShowUploadModal(false);
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!user || !isUnlocked) return;

    // Prevent sync if data hasn't loaded yet to avoid false duplicates
    if (loading) {
      alert("Please wait for existing logs to load before syncing.");
      return;
    }

    setIsSyncing(true);

    try {
      // Save credentials
      localStorage.setItem('intervals_athlete_id', syncConfig.athleteId);
      localStorage.setItem('intervals_api_key', syncConfig.apiKey);

      const rawActivities = await fetchActivities(syncConfig.athleteId, syncConfig.apiKey, syncConfig.afterDate);
      const processed = processActivities(rawActivities);

      let addedCount = 0;
      let skippedCount = 0;

      // Create a Set of existing external IDs for O(1) lookup
      // Ensure we only check against items that actually have an externalId
      const existingIds = new Set(
        trainingLogs
          .filter(l => l.externalId)
          .map(l => String(l.externalId))
      );

      for (const activity of processed) {
        // Strict string comparison
        if (existingIds.has(String(activity.externalId))) {
          skippedCount++;
          continue;
        }

        await addDoc(collection(db, 'ironman_logs'), {
          ...activity,
          createdAt: serverTimestamp()
        });
        addedCount++;
      }

      alert(`Sync complete.\nAdded: ${addedCount}\nSkipped (Duplicate): ${skippedCount}`);
      setShowSyncModal(false);
    } catch (error) {
      console.error(error);
      alert(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!confirm("Scrap this entry?")) return;
    const col = type === 'portfolio' ? 'garage_items' : 'ironman_logs';
    await deleteDoc(doc(db, col, id));
  };

  const totals = calculateTotals();

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-400 font-mono selection:bg-orange-900 selection:text-white">

      {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 border-b border-neutral-800 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleSecretTrigger}>
            <div className={`w-2 h-2 rounded-full ${isUnlocked ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
            <div className="text-sm font-bold tracking-widest uppercase text-neutral-200">
              NASSER_GARAGE {isUnlocked && <span className="text-red-500 ml-2">[ADMIN]</span>}
            </div>
          </div>

          <div className="hidden md:flex gap-8 text-[10px] font-bold tracking-widest uppercase">
            <a href="#garage" className="hover:text-orange-500 transition-colors">The Garage</a>
            <a href="#roadmap" className="hover:text-orange-500 transition-colors">Mission Roadmap</a>
          </div>
        </div>
      </nav>

      {/* PIN PAD */}
      {showPinPad && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg max-w-xs w-full text-center">
            <KeyRound className="w-8 h-8 text-orange-600 mx-auto mb-4" />
            <p className="text-xs text-neutral-500 mb-4">SECURE PROTOCOL</p>
            <form onSubmit={handlePinSubmit}>
              <input
                autoFocus type="password"
                className="w-full bg-black border border-neutral-800 text-center text-xl text-white p-3 rounded mb-4 focus:border-orange-600 outline-none"
                placeholder="CODE" maxLength={4}
                value={pinInput} onChange={e => setPinInput(e.target.value)}
              />
              <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-3 rounded">UNLOCK</button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto">

        {/* --- SECTION 1: THE GARAGE (Portfolio) --- */}
        <section id="garage" className="pt-32 px-6 pb-24 min-h-screen bg-[#0f0f0f]">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neutral-800 text-yellow-500 text-xs font-bold mb-6">
                <Hammer className="w-3 h-3" /> NASSER'S GARAGE
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">The Archive.</h2>
              <p className="text-sm text-neutral-500">
                A collection of frozen moments. <br />
                Raw, unpolished, real.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={`px-4 py-2 text-xs font-bold uppercase border transition-all ${filter === cat ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-500 hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portfolioItems.filter(i => filter === 'All' || i.category === filter).map(item => (
              <div key={item.id} onClick={() => setSelectedImage(item)} className={`group relative cursor-pointer bg-neutral-900 p-2 shadow-xl ${item.rotation || 'rotate-0'} hover:rotate-0 transition-all duration-500 hover:z-10`}>
                {isUnlocked && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'portfolio'); }} className="absolute -top-2 -right-2 z-20 bg-red-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                )}
                <div className="aspect-[4/5] overflow-hidden bg-black relative">
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
                </div>
                <div className="mt-3 px-2 flex justify-between items-center text-[10px] uppercase tracking-wider text-neutral-500 group-hover:text-neutral-300">
                  <span className="truncate max-w-[150px]">{item.filename}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center mt-20">
            <a href="#roadmap" className="animate-bounce p-2 bg-neutral-900 rounded-full text-neutral-500 hover:text-white transition-colors">
              <ChevronDown className="w-6 h-6" />
            </a>
          </div>
        </section>

        {/* --- SECTION 2: MISSION CONTROL (The Roadmap) --- */}
        <section id="roadmap" className="py-24 px-6 border-t border-neutral-800 min-h-screen bg-[#0a0a0a]">
          {/* Header & Countdown */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orange-900/20 text-orange-500 text-xs font-bold mb-4">
                <Activity className="w-3 h-3" /> ACTIVE MISSION
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tighter">
                Road to Ironman.
              </h1>
              <p className="text-sm text-neutral-500 max-w-lg leading-relaxed">
                Training for the 70.3 mile sufferfest. <br />
                Feb 14, 2026. No shortcuts.
              </p>
            </div>

            {/* The Big Countdown */}
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl text-center min-w-[200px]">
              <div className="text-5xl font-bold text-white font-sans mb-1">{getTimeUntilRace()}</div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Days Until Race</div>
            </div>
          </div>

          {/* Dashboard Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
            {/* SWIM */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-5 rounded-lg relative overflow-hidden group hover:border-blue-900/50 transition-colors">
              <div className="absolute top-0 left-0 h-0.5 bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((totals.swim / TARGETS.swim) * 100, 100)}%` }}></div>
              <div className="flex justify-between items-start mb-4">
                <Waves className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] text-neutral-600">{Math.round((totals.swim / TARGETS.swim) * 100)}% COMPLETE</span>
              </div>
              <div className="text-2xl font-bold text-white">{totals.swim.toFixed(1)} <span className="text-sm text-neutral-600 font-normal">/ {TARGETS.swim} km</span></div>
            </div>

            {/* BIKE */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-5 rounded-lg relative overflow-hidden group hover:border-orange-900/50 transition-colors">
              <div className="absolute top-0 left-0 h-0.5 bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min((totals.bike / TARGETS.bike) * 100, 100)}%` }}></div>
              <div className="flex justify-between items-start mb-4">
                <Bike className="w-5 h-5 text-orange-500" />
                <span className="text-[10px] text-neutral-600">{Math.round((totals.bike / TARGETS.bike) * 100)}% COMPLETE</span>
              </div>
              <div className="text-2xl font-bold text-white">{totals.bike.toFixed(1)} <span className="text-sm text-neutral-600 font-normal">/ {TARGETS.bike} km</span></div>
            </div>

            {/* RUN */}
            <div className="bg-neutral-900/30 border border-neutral-800 p-5 rounded-lg relative overflow-hidden group hover:border-green-900/50 transition-colors">
              <div className="absolute top-0 left-0 h-0.5 bg-green-500 transition-all duration-1000" style={{ width: `${Math.min((totals.run / TARGETS.run) * 100, 100)}%` }}></div>
              <div className="flex justify-between items-start mb-4">
                <Footprints className="w-5 h-5 text-green-500" />
                <span className="text-[10px] text-neutral-600">{Math.round((totals.run / TARGETS.run) * 100)}% COMPLETE</span>
              </div>
              <div className="text-2xl font-bold text-white">{totals.run.toFixed(1)} <span className="text-sm text-neutral-600 font-normal">/ {TARGETS.run} km</span></div>
            </div>
          </div>

          {/* --- THE ROADMAP TIMELINE --- */}
          <div className="relative max-w-3xl mx-auto">

            {/* Center Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-neutral-800 transform md:-translate-x-1/2"></div>

            {/* Finish Line Marker (Top) */}
            <div className="relative flex items-center mb-12 md:justify-center">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(234,88,12,0.5)]">
                <Flag className="w-4 h-4 text-white" />
              </div>
              <div className="ml-4 text-orange-500 font-bold tracking-widest text-xs">IRONMAN GOAL</div>
            </div>

            {/* Logs */}
            {trainingLogs.map((log, index) => {
              const isLeft = index % 2 === 0;
              // Icons based on activity
              const Icon = log.activityType === 'swim' ? Waves : log.activityType === 'bike' ? Bike : Footprints;
              const colorClass = log.activityType === 'swim' ? 'text-blue-500' : log.activityType === 'bike' ? 'text-orange-500' : 'text-green-500';

              return (
                <div key={log.id} className={`relative flex flex-col md:flex-row items-center mb-16 ${isLeft ? 'md:flex-row-reverse' : ''}`}>

                  {/* Timeline Node */}
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-[#0a0a0a] border-2 border-neutral-600 rounded-full z-10 transform -translate-x-[5px] md:-translate-x-1.5 mt-6 md:mt-0"></div>

                  {/* Spacer for Desktop Alignment */}
                  <div className="hidden md:block w-1/2"></div>

                  {/* Content Card */}
                  <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}>

                    <div className={`inline-flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest ${colorClass} ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <Icon className="w-4 h-4" />
                      <span>{log.activityType} // {log.distance}KM</span>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors group relative">
                      {isUnlocked && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id, 'training') }}
                          className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {log.url && (
                        <div className="mb-3 rounded overflow-hidden aspect-video">
                          <img src={log.url} className="w-full h-full object-cover opacity-90" alt="Log" />
                        </div>
                      )}

                      <p className="text-neutral-300 text-sm leading-relaxed mb-3">"{log.description}"</p>

                      <div className={`text-[10px] text-neutral-600 uppercase tracking-wider flex gap-4 ${isLeft ? 'md:justify-end' : ''}`}>
                        <span>{log.date}</span>
                        {log.duration && <span>{log.duration} MIN</span>}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}

            {trainingLogs.length === 0 && (
              <div className="text-center py-12 text-neutral-600 text-xs">
                NO LOGS RECORDED YET. JOURNEY BEGINS NOW.
              </div>
            )}

            {/* Start Line (Bottom) */}
            <div className="relative flex items-center mt-12 md:justify-center">
              <div className="w-4 h-4 rounded-full bg-neutral-800 z-10"></div>
            </div>
          </div>
        </section>

      </div>

      {/* --- ADMIN UPLOAD MODAL (Floating) --- */}
      {isUnlocked && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110"
          >
            {showUploadModal ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>

          {/* Modal Content */}
          {showUploadModal && (
            <div className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] bg-neutral-900 border border-neutral-700 p-6 rounded-lg shadow-2xl animate-in slide-in-from-bottom-10">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> UPLOAD CENTER</h3>

              <div className="flex gap-2 mb-4 p-1 bg-black rounded">
                <button onClick={() => setUploadType('portfolio')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${uploadType === 'portfolio' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Portfolio</button>
                <button onClick={() => setUploadType('training')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${uploadType === 'training' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Training</button>
              </div>

              <div className="mb-4">
                <button onClick={() => { setShowUploadModal(false); setShowSyncModal(true); }} className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-500 border border-blue-900/50 p-2 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Sync from Intervals.icu
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-3">
                <input type="date" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                  value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} />

                {uploadType === 'portfolio' ? (
                  <>
                    <input placeholder="Filename" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                      value={newItem.filename} onChange={e => setNewItem({ ...newItem, filename: e.target.value })} />
                    <select className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                      value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <select className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                      value={newItem.activityType} onChange={e => setNewItem({ ...newItem, activityType: e.target.value })}>
                      <option value="swim">Swim</option>
                      <option value="bike">Bike</option>
                      <option value="run">Run</option>
                    </select>
                    <input type="number" step="0.1" placeholder="Distance (km)" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                      value={newItem.distance} onChange={e => setNewItem({ ...newItem, distance: e.target.value })} />
                    <input type="number" placeholder="Duration (min)" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                      value={newItem.duration} onChange={e => setNewItem({ ...newItem, duration: e.target.value })} />
                  </>
                )}

                <div className="relative group">
                  <input type="file" accept="image/*" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImageFile(e.target.files[0]);
                        if (!newItem.filename) setNewItem(p => ({ ...p, filename: e.target.files[0].name }));
                      }
                    }}
                  />
                  <div className={`w-full bg-black border ${imageFile ? 'border-green-500 text-green-500' : 'border-neutral-800 text-neutral-500'} p-3 text-xs flex items-center gap-2`}>
                    <Upload className="w-3 h-3" /> {imageFile ? imageFile.name : "Select Image (Max 800px)..."}
                  </div>
                </div>

                <textarea placeholder="Notes..." rows="3" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500"
                  value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />

                <button disabled={isUploading} className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-xs py-3 tracking-widest flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUploading ? "SAVING..." : "COMMIT"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- SYNC MODAL --- */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> SYNC INTERVALS.ICU</h3>
              <button onClick={() => setShowSyncModal(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSync} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Athlete ID</label>
                <input type="text" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500"
                  value={syncConfig.athleteId} onChange={e => setSyncConfig({ ...syncConfig, athleteId: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API Key</label>
                <input type="password" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500"
                  value={syncConfig.apiKey} onChange={e => setSyncConfig({ ...syncConfig, apiKey: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Sync From Date</label>
                <input type="date" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500"
                  value={syncConfig.afterDate} onChange={e => setSyncConfig({ ...syncConfig, afterDate: e.target.value })} />
              </div>

              <button disabled={isSyncing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 tracking-widest flex items-center justify-center gap-2 mt-4">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isSyncing ? "SYNCING..." : "START SYNC"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage.url} className="max-h-[90vh] max-w-full shadow-2xl" alt="Full view" />
        </div>
      )}
    </div>
  );
}