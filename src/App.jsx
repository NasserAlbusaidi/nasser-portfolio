import React, { useState, useEffect, useMemo } from 'react';
import { History, Hammer, Trash2, Lock, Unlock, Save, KeyRound, Upload, Loader2, Activity, Waves, Bike, Footprints, Flag, MapPin, ChevronDown, RefreshCw, X, Plus, Menu, Dumbbell, Pencil } from 'lucide-react';
import BootSequence from './components/BootSequence';
import HolographicGauge from './components/HolographicGauge';
import { fetchActivities, processActivities } from './api/intervals';
import { extractExif } from './utils/exif';
import { reverseGeocode } from './utils/geocoding';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import LogBlueprintModal from './components/system/LogBlueprintModal';
import ConfirmationModal from './components/system/ConfirmationModal';
import Countdown from './components/system/Countdown';
import { useNotification } from './contexts/NotificationContext';
import HeatmapCalendar from './components/analytics/HeatmapCalendar';
import ProgressCharts from './components/analytics/ProgressCharts';
import PersonalRecords from './components/analytics/PersonalRecords';
import ParticleBackground from './components/effects/ParticleBackground'; // New import // New import // New import // New import


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
const IRONMAN_DATE = new Date(import.meta.env.VITE_IRONMAN_DATE);
const TARGETS = {
  swim: Number(import.meta.env.VITE_TARGET_SWIM),
  bike: Number(import.meta.env.VITE_TARGET_BIKE),
  run: Number(import.meta.env.VITE_TARGET_RUN),
  workout: Number(import.meta.env.VITE_TARGET_WORKOUT)
};
const INTERVALS_ATHLETE_ID = import.meta.env.VITE_INTERVALS_ATHLETE_ID;
const INTERVALS_API_KEY = import.meta.env.VITE_INTERVALS_API_KEY;
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function App() {
  const { addNotification } = useNotification();

  // Modals and State
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Navigation State
  const [filter, setFilter] = useState("All");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data State
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
  const [uploadType, setUploadType] = useState("training");
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    filename: '', date: new Date().toISOString().split('T')[0], time: '12:00', category: 'Street',
    location: '', description: '', rotation: 'rotate-0', activityType: 'run', distance: 0, duration: ''
  });

  // Sync State
  const [syncConfig, setSyncConfig] = useState({
    athleteId: INTERVALS_ATHLETE_ID || localStorage.getItem('intervals_athlete_id') || '',
    apiKey: INTERVALS_API_KEY || localStorage.getItem('intervals_api_key') || '',
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
        reader.onerror = reject;
      };
    });
  };

  const calculateTotals = () => {
    return trainingLogs.reduce((acc, log) => {
      const dist = parseFloat(log.distance) || 0;
      const duration = parseFloat(log.duration) || 0;
      if (log.activityType === 'swim') acc.swim += dist;
      if (log.activityType === 'bike') acc.bike += dist;
      if (log.activityType === 'run') acc.run += dist;
      if (log.activityType === 'workout') acc.workout += duration;
      return acc;
    }, { swim: 0, bike: 0, run: 0, workout: 0 });
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
    else { addNotification("INVALID_ACCESS_CODE", "error"); setPinInput(""); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user || !isUnlocked) return;
    setIsUploading(true);

    try {
      let imageUrl = '';
      let exifData = null;

      if (imageFile) {
        exifData = await extractExif(imageFile);
        if (exifData && exifData.gps) {
          const location = await reverseGeocode(exifData.gps.lat, exifData.gps.lng);
          if (location) exifData.location = location;
        }
        imageUrl = await compressImage(imageFile);
      }

      const collectionName = uploadType === 'portfolio' ? 'garage_items' : 'ironman_logs';
      await addDoc(collection(db, collectionName), {
        ...newItem, url: imageUrl, exif: exifData, createdAt: serverTimestamp()
      });

      addNotification("Entry committed.", "success");
      setNewItem(prev => ({ ...prev, filename: '', description: '', distance: 0 }));
      setImageFile(null);
      setShowUploadModal(false);
    } catch (error) {
      console.error(error);
      addNotification("Upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!user || !isUnlocked) return;
    if (loading) {
      addNotification("Please wait for existing logs to load before syncing.", "info");
      return;
    }
    setIsSyncing(true);
    let addedCount = 0, updatedCount = 0, skippedCount = 0;

    try {
      localStorage.setItem('intervals_athlete_id', syncConfig.athleteId);
      localStorage.setItem('intervals_api_key', syncConfig.apiKey);
      const rawActivities = await fetchActivities(syncConfig.athleteId, syncConfig.apiKey, syncConfig.afterDate);
      const processed = processActivities(rawActivities);
      const existingIds = new Set(trainingLogs.map(l => String(l.externalId)));

      for (const activity of processed) {
        if (existingIds.has(String(activity.externalId))) {
          const logToUpdate = trainingLogs.find(l => String(l.externalId) === String(activity.externalId));
          if (logToUpdate && logToUpdate.id) {
            const docRef = doc(db, 'ironman_logs', logToUpdate.id);
            await updateDoc(docRef, { ...activity, updatedAt: serverTimestamp() });
            updatedCount++;
          } else { skippedCount++; }
        } else {
          await addDoc(collection(db, 'ironman_logs'), { ...activity, createdAt: serverTimestamp() });
          addedCount++;
        }
      }
      addNotification(`Sync complete. Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`, "success");
      setShowSyncModal(false);
    } catch (error) {
      console.error(error);
      addNotification(`Sync failed: ${error.message}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id, type) => {
    setConfirmationModal({
      isOpen: true,
      title: 'CONFIRM DELETION',
      message: `Are you sure you want to permanently scrap this entry? LOG_ID: ${id.slice(0, 8).toUpperCase()}`,
      onConfirm: async () => {
        const col = type === 'portfolio' ? 'garage_items' : 'ironman_logs';
        await deleteDoc(doc(db, col, id));
        addNotification("Entry successfully scrapped.", "success");
      }
    });
  };

  const handleEdit = (log) => {
    setEditingLog({ ...log });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user || !isUnlocked || !editingLog) return;
    setIsUploading(true);
    try {
      let imageUrl = editingLog.url;
      if (imageFile) imageUrl = await compressImage(imageFile);
      await updateDoc(doc(db, 'ironman_logs', editingLog.id), {
        ...editingLog, url: imageUrl || null, updatedAt: serverTimestamp()
      });
      addNotification("Log updated.", "success");
      setEditingLog(null);
      setImageFile(null);
      setShowEditModal(false);
    } catch (error) {
      console.error(error);
      addNotification("Update failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const RevealOnScroll = ({ children, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = React.useRef(null);
    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      }, { threshold: 0.1 });
      if (ref.current) observer.observe(ref.current);
      return () => { if (ref.current) observer.unobserve(ref.current); };
    }, []);
    return (
      <div ref={ref} className={`${className} transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {children}
      </div>
    );
  };

  const totals = calculateTotals();

  // --- 5. ANALYTICS DATA PROCESSING ---
  const dailyActivityTotals = useMemo(() => {
    const totals = {};
    trainingLogs.forEach(log => {
      const date = log.date;
      const distance = parseFloat(log.distance) || 0;
      if (totals[date]) {
        totals[date] += distance;
      } else {
        totals[date] = distance;
      }
    });
    return totals;
  }, [trainingLogs]);

  // --- 6. WEEKLY CHART DATA PROCESSING ---
  const weeklyChartData = useMemo(() => {
    const data = {};
    trainingLogs.forEach(log => {
      const logDate = new Date(log.date);
      const weekStart = new Date(logDate);
      weekStart.setDate(logDate.getDate() - (logDate.getDay() + 6) % 7); // Adjust to Monday
      weekStart.setHours(0, 0, 0, 0);

      const weekKey = weekStart.toISOString().split('T')[0];

      if (!data[weekKey]) {
        data[weekKey] = { week: weekKey, swim: 0, bike: 0, run: 0, workout: 0 };
      }

      const value = parseFloat(log.distance) || parseFloat(log.duration) || 0;
      data[weekKey][log.activityType] += value;
    });
    return Object.values(data).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [trainingLogs]);

  // --- 7. PERSONAL RECORDS PROCESSING ---
  const personalRecords = useMemo(() => {
    const prs = {
      longestRun: { value: 0, date: null, id: null },
      longestBike: { value: 0, date: null, id: null },
      longestSwim: { value: 0, date: null, id: null },
      highestMaxPower: { value: 0, date: null, id: null },
    };

    trainingLogs.forEach(log => {
      const distance = parseFloat(log.distance) || 0;
      const maxPower = parseFloat(log.maxPower) || 0;

      if (log.activityType === 'run' && distance > prs.longestRun.value) {
        prs.longestRun = { value: distance, date: log.date, id: log.id };
      } else if (log.activityType === 'bike' && distance > prs.longestBike.value) {
        prs.longestBike = { value: distance, date: log.date, id: log.id };
      } else if (log.activityType === 'swim' && distance > prs.longestSwim.value) {
        prs.longestSwim = { value: distance, date: log.date, id: log.id };
      }

      if (log.activityType === 'bike' && maxPower > prs.highestMaxPower.value) {
        prs.highestMaxPower = { value: maxPower, date: log.date, id: log.id };
      }
    });

    return prs;
  }, [trainingLogs]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-300 font-mono selection:bg-neon-orange selection:text-black relative overflow-hidden">
      <div className="scanlines-global"></div>
      <ParticleBackground /> // Render the particle background
      {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}

      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/95 border-b border-neutral-800 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={handleSecretTrigger}>
            <div className={`w-3 h-3 ${isUnlocked ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-neon-green shadow-[0_0_10px_#00FF41]'} animate-pulse`}></div>
            <div className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-400 group-hover:text-white transition-colors">NASSER_OS <span className="text-neutral-600">//</span> v2.0</div>
          </div>
          <div className="hidden md:flex gap-8 text-xs font-bold tracking-[0.2em] uppercase">
            <a href="#garage" className="text-neutral-500 hover:text-neon-orange hover:underline decoration-2 underline-offset-4 transition-all">Archive</a>
            <a href="#roadmap" className="text-neutral-500 hover:text-neon-orange hover:underline decoration-2 underline-offset-4 transition-all">Mission</a>
            <a href="#analytics" className="text-neutral-500 hover:text-neon-orange hover:underline decoration-2 underline-offset-4 transition-all">Analytics</a>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}</button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] py-4">
            <a href="#garage" className="block text-center text-sm uppercase py-2 hover:text-orange-500 transition-colors" onClick={() => setIsMenuOpen(false)}>The Garage</a>
            <a href="#roadmap" className="block text-center text-sm uppercase py-2 hover:text-orange-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Mission Roadmap</a>
            <a href="#analytics" className="block text-center text-sm uppercase py-2 hover:text-orange-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Analytics</a>
          </div>
        )}
      </nav>

      {showPinPad && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg max-w-xs w-full text-center">
            <KeyRound className="w-8 h-8 text-orange-600 mx-auto mb-4" />
            <p className="text-xs text-neutral-500 mb-4">SECURE PROTOCOL</p>
            <form onSubmit={handlePinSubmit}>
              <input autoFocus type="password" className="w-full bg-black border border-neutral-800 text-center text-xl text-white p-3 rounded mb-4 focus:border-orange-600 outline-none" placeholder="CODE" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)} />
              <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-3 rounded">UNLOCK</button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto">
        <section id="garage" className="pt-40 px-4 md:px-8 pb-32 min-h-screen bg-[#050505]">
          <div className="mb-24 border-b border-neutral-800 pb-12">
            <div className="flex flex-col gap-2 mb-8">
              <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-neon-green">
                <span className="animate-blink">● SYSTEM ONLINE</span><span className="text-neutral-700">|</span><span>RETRIEVING ASSETS...</span>
              </div>
              <h1 className="text-5xl md:text-9xl font-black text-white tracking-tighter leading-[0.9] uppercase">Visual<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-700 to-neutral-900">Manifesto</span></h1>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <p className="max-w-xl text-sm md:text-base text-neutral-400 font-mono leading-relaxed border-l-4 border-neon-orange pl-6">
                <span className="bg-white text-black px-1 font-bold mr-2">CLASSIFIED</span> RAW, UNFILTERED REALITY. NO FILTERS. NO STAGING. JUST THE MOMENT AS IT EXISTS IN THE <span className="bg-neutral-800 text-transparent select-none">REDACTED</span>.
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 text-[10px] font-bold uppercase border transition-all tracking-widest ${filter === cat ? 'bg-neon-orange text-black border-neon-orange' : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600'}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolioItems.filter(i => filter === 'All' || i.category === filter).map(item => (
              <div key={item.id} onClick={() => setSelectedImage(item)} className="group relative cursor-pointer bg-black border border-neutral-800 hover:border-neon-green transition-colors duration-300">
                <div className="aspect-auto md:aspect-[4/3] overflow-hidden relative chromatic-hover">
                  <img src={item.url} alt={item.filename} className="w-full h-auto md:h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0" />
                  <div className="scanline-sweep"></div>
                </div>
                <div className="p-6 border-t border-neutral-800 bg-[#080808] group-hover:bg-[#0a0a0a] transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-neon-orange text-xs font-bold tracking-widest mb-1">IMG_{item.id.slice(0, 4).toUpperCase()}</div>
                      <div className="text-white text-lg font-bold uppercase tracking-tight">{item.filename}</div>
                    </div>
                    <div className="text-neutral-600 text-xs font-mono text-right">
                      <div>{item.date}</div>
                      <div className="text-[10px] mt-1 text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">ACCESS_GRANTED</div>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 bg-black p-3 border border-neutral-900 group-hover:border-neutral-700 transition-colors">
                    <div className="grid grid-cols-2 gap-y-1">
                      <span>CAM: {item.exif?.model || <span className="text-red-900">// DATA_CORRUPTED</span>}</span>
                      <span>ISO: {item.exif?.iso || <span className="text-red-900">[MISSING]</span>}</span>
                      <span>LENS: {item.exif?.lens || <span className="text-red-900">UNKNOWN_OPTIC</span>}</span>
                      <span>APERTURE: {item.exif?.aperture || <span className="text-red-900">N/A</span>}</span>
                    </div>
                  </div>
                </div>
                {isUnlocked && <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, 'portfolio'); }} className="absolute top-4 right-4 z-20 bg-red-600 text-white p-2 hover:bg-red-700 border border-red-900"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-32">
            <a href="#roadmap" className="group flex flex-col items-center gap-4 text-neutral-600 hover:text-white transition-colors">
              <div className="h-16 w-[1px] bg-neutral-800 group-hover:bg-neon-orange transition-colors"></div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Scroll for Intel</span>
            </a>
          </div>
        </section>

        <section id="roadmap" className="py-24 px-6 border-t border-neutral-800 min-h-screen bg-[#0a0a0a]">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 mb-16">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orange-900/20 text-orange-500 text-xs font-bold mb-4"><Activity className="w-3 h-3" /> ACTIVE MISSION</div>
              <h1 className="text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tighter">Road to Ironman.</h1>
              <p className="text-sm text-neutral-500 max-w-lg leading-relaxed">Training for the 70.3 mile sufferfest. <br />Feb 14, 2026. No shortcuts.</p>
            </div>
            {/* The Big Countdown */}
            <Countdown targetDate={IRONMAN_DATE} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            <HolographicGauge value={totals.swim} max={TARGETS.swim} label="SWIM PROTOCOL" unit="KM" color="#3B82F6" />
            <HolographicGauge value={totals.bike} max={TARGETS.bike} label="BIKE PROTOCOL" unit="KM" color="#F97316" />
            <HolographicGauge value={totals.run} max={TARGETS.run} label="RUN PROTOCOL" unit="KM" color="#22C55E" />
            <HolographicGauge value={totals.workout} max={TARGETS.workout} label="GYM PROTOCOL" unit="MIN" color="#EF4444" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-800 to-transparent transform md:-translate-x-1/2"></div>
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon-orange to-transparent transform md:-translate-x-1/2 opacity-20 animate-pulse"></div>
            <div className="relative flex items-center mb-12 md:justify-center">
              <div className="w-8 h-8 bg-orange-600 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(234,88,12,0.5)] border border-orange-400"><Flag className="w-4 h-4 text-white" /></div>
              <div className="ml-4 text-orange-500 font-bold tracking-widest text-xs font-mono">IRONMAN GOAL</div>
            </div>
            {trainingLogs.map((log, index) => {
              const isLeft = index % 2 === 0;
              const Icon = log.activityType === 'swim' ? Waves : log.activityType === 'bike' ? Bike : log.activityType === 'workout' ? Dumbbell : Footprints;
              const colorClass = log.activityType === 'swim' ? 'text-blue-500' : log.activityType === 'bike' ? 'text-orange-500' : log.activityType === 'workout' ? 'text-red-600' : 'text-green-500';
              return (
                <RevealOnScroll key={log.id} className={`relative flex flex-col md:flex-row items-center mb-16 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-black border border-neutral-600 z-10 transform -translate-x-[7px] md:-translate-x-2 mt-6 md:mt-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:border-neon-orange transition-colors">
                    <div className={`w-2 h-2 rounded-full absolute top-1 left-1 ${log.activityType === 'swim' ? 'bg-blue-500' : log.activityType === 'bike' ? 'bg-orange-500' : log.activityType === 'workout' ? 'bg-red-500' : 'bg-green-500'} opacity-50`}></div>
                  </div>
                  <div className="hidden md:block w-1/2"></div>
                  <div onClick={() => setSelectedLog(log)} className={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}>
                    <div className={`inline-flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest font-mono ${colorClass} ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <Icon className="w-4 h-4" /><span>{log.activityType} // {log.distance}KM</span>
                    </div>
                    <div className="bg-[#080808]/80 backdrop-blur-sm border border-neutral-800 p-6 hover:border-neon-orange transition-colors group relative overflow-hidden cursor-pointer">
                      <div className="scanline-sweep"></div>
                      {isUnlocked && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(log); }} className="text-neutral-600 hover:text-neon-green transition-colors"><Pencil className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id, 'training') }} className="text-neutral-600 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-700 font-mono mb-2">LOG_ID: {log.id.slice(0, 8).toUpperCase()}</div>
                      {log.url && <div className="mb-4 overflow-hidden aspect-video border border-neutral-900 relative chromatic-hover"><img src={log.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" alt="Log" /></div>}
                      <p className="text-neutral-300 text-sm leading-relaxed mb-4 font-mono group-hover:text-white transition-colors">"{log.description}"</p>
                      <div className={`text-[10px] text-neutral-600 uppercase tracking-wider flex gap-4 font-mono ${isLeft ? 'md:justify-end' : ''}`}>
                        <span>{log.date}</span>{log.duration && <span>{log.duration} MIN</span>}
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
            {trainingLogs.length === 0 && <div className="text-center py-12 text-neutral-600 text-xs">NO LOGS RECORDED YET. JOURNEY BEGINS NOW.</div>}
            <div className="relative flex items-center mt-12 md:justify-center"><div className="w-4 h-4 rounded-full bg-neutral-800 z-10"></div></div>
          </div>
        </section>

        {/* --- SECTION 3: MISSION ANALYTICS --- */}
        <section id="analytics" className="py-24 px-6 border-t border-neutral-800 min-h-screen bg-[#050505]">
          <h1 className="text-5xl font-bold text-white text-center mb-12">Mission Analytics</h1>
          <div className="flex justify-center mb-12">
            <HeatmapCalendar activityData={dailyActivityTotals} year={new Date().getFullYear()} />
          </div>
          <ProgressCharts chartData={weeklyChartData} />
          <PersonalRecords prData={personalRecords} />
        </section>
      </div>

      {isUnlocked && (
        <div className="fixed bottom-6 right-6 z-30">
          <button onClick={() => setShowUploadModal(!showUploadModal)} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110">{showUploadModal ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}</button>
          {showUploadModal && (
            <div className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] bg-neutral-900 border border-neutral-700 p-6 rounded-lg shadow-2xl animate-in slide-in-from-bottom-10">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> UPLOAD CENTER</h3>
              <div className="flex gap-2 mb-4 p-1 bg-black rounded">
                <button onClick={() => setUploadType('portfolio')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${uploadType === 'portfolio' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Portfolio</button>
                <button onClick={() => setUploadType('training')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${uploadType === 'training' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Training</button>
              </div>
              <div className="mb-4"><button onClick={() => { setShowUploadModal(false); setShowSyncModal(true); }} className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-500 border border-blue-900/50 p-2 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-2"><RefreshCw className="w-3 h-3" /> Sync from Intervals.icu</button></div>
              <form onSubmit={handleUpload} className="space-y-3">
                <input type="date" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} />
                {uploadType === 'portfolio' ? (
                  <>
                    <input placeholder="Filename" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.filename} onChange={e => setNewItem({ ...newItem, filename: e.target.value })} />
                    <select className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                      {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <select className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.activityType} onChange={e => setNewItem({ ...newItem, activityType: e.target.value })}>
                      <option value="swim">Swim</option><option value="bike">Bike</option><option value="run">Run</option>
                    </select>
                    <input type="number" step="0.1" placeholder="Distance (km)" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.distance} onChange={e => setNewItem({ ...newItem, distance: e.target.value })} />
                    <input type="number" placeholder="Duration (min)" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.duration} onChange={e => setNewItem({ ...newItem, duration: e.target.value })} />
                  </>
                )}
                <div className="relative group">
                  <input type="file" accept="image/*" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20" onChange={(e) => { if (e.target.files?.[0]) { setImageFile(e.target.files[0]); if (!newItem.filename) setNewItem(p => ({ ...p, filename: e.target.files[0].name })); } }} />
                  <div className={`w-full bg-black border ${imageFile ? 'border-green-500 text-green-500' : 'border-neutral-800 text-neutral-500'} p-3 text-xs flex items-center gap-2`}><Upload className="w-3 h-3" /> {imageFile ? imageFile.name : "Select Image (Max 800px)..."}</div>
                </div>
                <textarea placeholder="Notes..." rows="3" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neutral-500" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                <button disabled={isUploading} className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-xs py-3 tracking-widest flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isUploading ? "SAVING..." : "COMMIT"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {showEditModal && editingLog && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#050505] border-2 border-neon-orange p-6 rounded-none shadow-[0_0_30px_rgba(255,95,0,0.2)] max-w-md w-full relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-neon-orange hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-neon-orange font-bold mb-6 flex items-center gap-2 tracking-widest uppercase"><Pencil className="w-4 h-4" /> UPDATE_PROTOCOL // {editingLog.id.slice(0, 8)}</h3>
            <form onSubmit={handleUpdate} className="space-y-4 font-mono">
              <div>
                <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Date</label>
                <input type="date" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingLog.date} onChange={e => setEditingLog({ ...editingLog, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Type</label>
                  <select className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange uppercase" value={editingLog.activityType} onChange={e => setEditingLog({ ...editingLog, activityType: e.target.value })}>
                    <option value="swim">Swim</option><option value="bike">Bike</option><option value="run">Run</option><option value="workout">Workout</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Dist (km)</label>
                  <input type="number" step="0.1" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingLog.distance} onChange={e => setEditingLog({ ...editingLog, distance: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Duration (min)</label>
                <input type="number" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingLog.duration} onChange={e => setEditingLog({ ...editingLog, duration: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Description</label>
                <textarea rows="3" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingLog.description} onChange={e => setEditingLog({ ...editingLog, description: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Update Visual</label>
                <div className="relative group">
                  <input type="file" accept="image/*" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20" onChange={(e) => { if (e.target.files?.[0]) { setImageFile(e.target.files[0]); } }} />
                  <div className={`w-full bg-black border ${imageFile ? 'border-neon-green text-neon-green' : 'border-neutral-800 text-neutral-500'} p-3 text-xs flex items-center gap-2`}><Upload className="w-3 h-3" /> {imageFile ? imageFile.name : "Select New Image..."}</div>
                </div>
              </div>
              <button disabled={isUploading} className="w-full bg-neon-orange hover:bg-white text-black font-bold text-xs py-4 tracking-[0.2em] flex items-center justify-center gap-2 transition-colors">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isUploading ? "OVERWRITING..." : "CONFIRM_UPDATE"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                <input type="text" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500" value={syncConfig.athleteId} onChange={e => setSyncConfig({ ...syncConfig, athleteId: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API Key</label>
                <input type="password" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500" value={syncConfig.apiKey} onChange={e => setSyncConfig({ ...syncConfig, apiKey: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Sync From Date</label>
                <input type="date" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500" value={syncConfig.afterDate} onChange={e => setSyncConfig({ ...syncConfig, afterDate: e.target.value })} />
              </div>
              <button disabled={isSyncing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 tracking-widest flex items-center justify-center gap-2 mt-4">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{isSyncing ? "SYNCING..." : "START SYNC"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
      />

      <LogBlueprintModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        athleteId={INTERVALS_ATHLETE_ID}
        apiKey={INTERVALS_API_KEY}
        mapboxToken={MAPBOX_ACCESS_TOKEN}
      />

      {/* Blueprint Modal - BRUTALIST */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12" onClick={() => setSelectedImage(null)}>
          <div className="w-full max-w-7xl h-[85vh] bg-[#050505] border-2 border-neutral-800 flex flex-col md:flex-row relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 z-30 text-white hover:text-neon-orange bg-black p-4 border-b border-l border-neutral-800 hover:bg-neutral-900 transition-colors"><X className="w-6 h-6" /></button>
            <div className="w-full md:w-2/3 h-[40vh] md:h-full shrink-0 bg-[#080808] relative flex items-center justify-center p-8 border-b-2 md:border-b-0 md:border-r-2 border-neutral-800">
              <img src={selectedImage.url} className="max-h-full max-w-full object-contain" alt="Blueprint View" />
              <div className="absolute top-4 left-4 text-[10px] text-neon-green font-mono tracking-widest bg-black px-2 py-1 border border-neon-green/30">FIG. 1.0 // RAW_ASSET</div>
              <div className="absolute bottom-4 right-4 text-[10px] text-neon-green font-mono tracking-widest bg-black px-2 py-1 border border-neon-green/30">SCALE: 1:1</div>
            </div>
            <div className="w-full md:w-1/3 h-full p-4 md:p-8 font-mono text-neutral-400 flex flex-col relative z-10 bg-[#050505] overflow-y-auto">
              <div className="mb-8 border-b-2 border-neutral-800 pb-6">
                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">{selectedImage.description || selectedImage.filename?.split('.').slice(0, -1).join('.') || 'Untitled'}</h3>
                <div className="text-xs text-neon-orange tracking-[0.2em] uppercase">CLASSIFIED // {selectedImage.category}</div>
              </div>
              <div className="space-y-8 flex-1 overflow-y-auto">
                <div>
                  <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">Description</label>
                  <p className="text-sm leading-relaxed text-neutral-300 border-l-2 border-neutral-800 pl-4">{selectedImage.description || "No description available for this asset."}</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">Date Captured</label>
                    <div className="text-lg font-bold text-white">{selectedImage.exif?.date || selectedImage.date}</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">Asset ID</label>
                    <div className="text-lg font-bold text-white">{selectedImage.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-600 uppercase tracking-widest block mb-2">Technical Specs</label>
                  <div className="text-xs space-y-2 text-neutral-400 font-mono border border-neutral-900 p-4 bg-[#080808]">
                    <div className="flex justify-between border-b border-neutral-900 pb-2"><span>CAMERA</span><span className="text-white">{selectedImage.exif?.model || "// UNKNOWN"}</span></div>
                    <div className="flex justify-between border-b border-neutral-900 pb-2"><span>LENS</span><span className="text-white">{selectedImage.exif?.lens || "// UNKNOWN"}</span></div>
                    <div className="flex justify-between border-b border-neutral-900 pb-2"><span>SETTINGS</span><span className="text-white">{selectedImage.exif ? `${selectedImage.exif.iso || '-'} ISO | ${selectedImage.exif.aperture || '-'} | ${selectedImage.exif.shutterSpeed || '-'}` : "N/A"}</span></div>
                    <div className="flex justify-between">
                      <span>LOCATION</span>
                      <span className="text-neon-orange text-right">
                        {selectedImage.exif?.location ? (
                          selectedImage.exif.location.city === 'Unknown Location' && selectedImage.exif.location.state ? (
                            <span>{selectedImage.exif.location.state}</span>
                          ) : (
                            <span>
                              {selectedImage.exif.location.city}
                              {selectedImage.exif.location.state && `, ${selectedImage.exif.location.state}`}
                              {!selectedImage.exif.location.state && selectedImage.exif.location.country && `, ${selectedImage.exif.location.country}`}
                            </span>
                          )
                        ) : (
                          <span>[Location not found]</span>
                        )}
                      </span>
                    </div>
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
      )}
    </div>
  );
}