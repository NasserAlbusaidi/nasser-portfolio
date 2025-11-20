import React, { useState, useEffect, useMemo } from 'react';
import { Camera, X, MapPin, Calendar, History, ChevronRight, Hammer, Wrench, Plus, Trash2, Lock, Unlock, Save, KeyRound, Upload, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
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

// --- CRITICAL: THESE MUST BE HERE FOR THE APP TO WORK ---
const auth = getAuth(app);
const db = getFirestore(app);

const CATEGORIES = ["All", "Landscape", "Portrait", "Street"];
const ACCESS_PIN = "1997"; 

// Initial Mock Data for fallback
const FALLBACK_ITEMS = [
  {
    id: 'fallback-1',
    filename: "WAHIBA_SUNSET_RAW.CR2",
    date: "2023-11-19", 
    time: "17:45",
    category: "Landscape",
    url: "https://images.unsplash.com/photo-1547234935-80c7142ee969?auto=format&fit=crop&q=80&w=1000",
    location: "Wahiba Sands",
    description: "Two years ago today. I remember forgetting my tripod and having to balance the camera on a rock.",
    rotation: "rotate-1" 
  }
];

export default function App() {
  const [filter, setFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [memories, setMemories] = useState([]);
  const [showMemories, setShowMemories] = useState(false);
  
  // Firebase State
  const [user, setUser] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin / Security State
  const [clickCount, setClickCount] = useState(0); 
  const [showPinPad, setShowPinPad] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  
  // Upload State (NEW)
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newItem, setNewItem] = useState({
    filename: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    category: 'Street',
    location: '',
    description: '',
    rotation: 'rotate-0'
  });

  // 1. Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    if (!user) return;
    const collectionRef = collection(db, 'garage_items');
    
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedItems = items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPortfolioItems(items.length > 0 ? sortedItems : FALLBACK_ITEMS);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching portfolio:", error);
      setPortfolioItems(FALLBACK_ITEMS);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. "On This Day" Logic
  const TODAY = useMemo(() => new Date(), []);
  useEffect(() => {
    if (loading) return;
    const foundMemories = portfolioItems.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return (
        itemDate.getDate() === TODAY.getDate() && 
        itemDate.getMonth() === TODAY.getMonth() &&
        itemDate.getFullYear() !== TODAY.getFullYear()
      );
    });
    setMemories(foundMemories);
  }, [portfolioItems, TODAY, loading]);

  // Handlers
  const handleSecretTrigger = () => {
    if (isUnlocked) return; 
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount === 3) {
        setShowPinPad(true);
        return 0;
      }
      return newCount;
    });
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === ACCESS_PIN) {
      setIsUnlocked(true);
      setShowPinPad(false);
      setPinInput("");
    } else {
      alert("ACCESS_DENIED: INVALID_CREDENTIALS");
      setPinInput("");
      setShowPinPad(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setShowPinPad(false);
  };

  // --- HELPER: Compress Image to Base64 (Bypasses Storage Billing) ---
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Max width 800px ensures we stay under the 1MB Firestore limit
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compress to JPEG at 60% quality
          resolve(canvas.toDataURL('image/jpeg', 0.6)); 
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // --- HANDLE UPLOAD (COMPRESS & SAVE) ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!user || !isUnlocked) return;
    if (!imageFile) {
      alert("Please select an image file to upload.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Compress the image on the client side
      const base64Image = await compressImage(imageFile);
      
      // 2. Save directly to Firestore (No Storage Bucket needed)
      const collectionRef = collection(db, 'garage_items');
      const rotations = ["rotate-0", "rotate-1", "-rotate-1", "rotate-2", "-rotate-2"];
      const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];
      
      await addDoc(collectionRef, {
        ...newItem,
        url: base64Image, // Storing the image data string directly
        rotation: randomRotation,
        createdAt: serverTimestamp()
      });
      
      // 3. Reset Form
      setNewItem({
        filename: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        category: 'Street',
        location: '',
        description: '',
        rotation: 'rotate-0'
      });
      setImageFile(null);
      alert("Item compressed and saved to garage.");
      
    } catch (error) {
      console.error("Error uploading item:", error);
      alert("Failed to save. The image might be too large even after compression.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    if (!isUnlocked) return;
    if (!confirm("Scrap this photo permanently?")) return;
    try {
      await deleteDoc(doc(db, 'garage_items', id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // Filtering
  const filteredItems = filter === "All" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === filter);

  const openLightbox = (item) => {
    setSelectedImage(item);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const getYearsAgo = (dateString) => {
    const itemYear = new Date(dateString).getFullYear();
    const currentYear = TODAY.getFullYear();
    const diff = currentYear - itemYear;
    return diff === 1 ? '1 year ago' : `${diff} years ago`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-400 font-mono selection:bg-yellow-900 selection:text-white pb-20">
      
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#121212]/90 border-b border-neutral-800 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isUnlocked ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} title={isUnlocked ? "UNSECURE" : "SECURE"}></div>
            <div className="text-sm font-bold tracking-widest uppercase text-neutral-200">
              NASSER'S_GARAGE {isUnlocked && <span className="text-red-500 ml-2">[UNLOCKED]</span>}
            </div>
          </div>
          <div className="flex gap-6 text-[10px] tracking-wide uppercase items-center">
            <button 
              onClick={handleSecretTrigger}
              className={`hidden sm:block transition-colors cursor-pointer select-none ${isUnlocked ? 'text-red-500 hover:text-red-400' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
              Status: {loading ? "Loading..." : (isUnlocked ? "MAINTENANCE_MODE" : "Developing")}
            </button>
            
            {isUnlocked && (
              <button onClick={handleLock} className="flex items-center gap-1 text-neutral-400 hover:text-white">
                <Lock className="w-3 h-3" /> LOCK
              </button>
            )}

            <span className="text-yellow-600 font-bold">EST. 1997</span>
          </div>
        </div>
      </nav>

      {/* PIN Pad Modal */}
      {showPinPad && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-neutral-800 p-8 rounded-lg max-w-xs w-full shadow-2xl relative">
            <button onClick={() => setShowPinPad(false)} className="absolute top-4 right-4 text-neutral-600 hover:text-white"><X className="w-4 h-4" /></button>
            
            <div className="text-center mb-8">
              <KeyRound className="w-8 h-8 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-white font-bold tracking-widest uppercase text-sm">Restricted Access</h3>
              <p className="text-xs text-neutral-600 mt-2">Enter garage security code</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input 
                autoFocus
                type="password" 
                className="w-full bg-black border border-neutral-700 text-center text-2xl text-white p-4 rounded tracking-[0.5em] focus:border-yellow-600 focus:outline-none"
                placeholder="••••"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              <button type="submit" className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-widest p-3 rounded transition-colors">
                Authenticate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="pt-24 px-6 max-w-screen-2xl mx-auto">
        
        {/* Header */}
        <header className="mb-16 border-b border-dashed border-neutral-800 pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neutral-800 text-yellow-500 text-xs font-bold mb-6">
                <Hammer className="w-3 h-3" />
                WORK IN PROGRESS
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-neutral-200 mb-6 tracking-tight">
                Welcome to the shop.
              </h1>
              <p className="text-sm leading-loose text-neutral-500">
                This isn't a gallery. It's where I dump my work. <br/>
                Some of it is polished, some of it is raw.
              </p>
            </div>

            {/* Memory Widget */}
            {memories.length > 0 && (
              <div className="relative group cursor-pointer" onClick={() => setShowMemories(true)}>
                 <div className="absolute -top-3 -right-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce">
                    {memories.length} MEMORIES
                 </div>
                 <div className="relative w-64 h-48 bg-neutral-800 border-4 border-white transform rotate-3 shadow-2xl transition-transform group-hover:rotate-0 group-hover:scale-105 duration-300">
                    <img src={memories[0].url} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="Memory" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-white font-bold">
                           <History className="w-3 h-3" />
                           ON THIS DAY
                        </div>
                    </div>
                 </div>
                 <div className="absolute inset-0 bg-neutral-700 border-4 border-white transform -rotate-2 -z-10 rounded-sm"></div>
              </div>
            )}
          </div>

          {/* Admin Upload Form (SECURE AREA) */}
          {isUnlocked && (
            <div className="mt-12 p-6 border border-yellow-600/30 bg-yellow-900/5 rounded-lg animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold uppercase tracking-widest">
                  <Unlock className="w-4 h-4" /> Secure Upload Channel
                </div>
                <div className="text-xs text-neutral-600 font-mono">
                  SESSION_ID: {Date.now().toString().slice(-6)}
                </div>
              </div>

              <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                  required
                  placeholder="Filename (e.g. IMG_001.RAW)"
                  className="bg-black border border-neutral-700 p-2 text-xs text-white rounded focus:border-yellow-500 outline-none"
                  value={newItem.filename}
                  onChange={e => setNewItem({...newItem, filename: e.target.value})}
                />
                
                {/* FILE INPUT (Replaced URL Input) */}
                <div className="relative group">
                  <input 
                    required
                    type="file"
                    accept="image/*"
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-20"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        // Auto-fill filename if empty
                        if (!newItem.filename) {
                           setNewItem(prev => ({...prev, filename: e.target.files[0].name}));
                        }
                      }
                    }}
                  />
                  <div className={`bg-black border ${imageFile ? 'border-yellow-500 text-yellow-500' : 'border-neutral-700 text-neutral-500'} p-2 text-xs rounded flex items-center gap-2 overflow-hidden whitespace-nowrap`}>
                    <Upload className="w-3 h-3 flex-shrink-0" />
                    {imageFile ? imageFile.name : "Select File..."}
                  </div>
                </div>

                <input 
                  required
                  type="date"
                  className="bg-black border border-neutral-700 p-2 text-xs text-white rounded focus:border-yellow-500 outline-none"
                  value={newItem.date}
                  onChange={e => setNewItem({...newItem, date: e.target.value})}
                />
                <select 
                  className="bg-black border border-neutral-700 p-2 text-xs text-white rounded focus:border-yellow-500 outline-none"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input 
                  placeholder="Location"
                  className="bg-black border border-neutral-700 p-2 text-xs text-white rounded focus:border-yellow-500 outline-none"
                  value={newItem.location}
                  onChange={e => setNewItem({...newItem, location: e.target.value})}
                />
                <input 
                  placeholder="Time"
                  type="time"
                  className="bg-black border border-neutral-700 p-2 text-xs text-white rounded focus:border-yellow-500 outline-none"
                  value={newItem.time}
                  onChange={e => setNewItem({...newItem, time: e.target.value})}
                />
                <input 
                  placeholder="Description"
                  className="bg-black border border-neutral-700 p-2 text-xs text-white rounded focus:border-yellow-500 outline-none md:col-span-2"
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                />
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className={`bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-xs uppercase tracking-widest p-2 rounded transition-colors flex items-center justify-center gap-2 md:col-span-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  {isUploading ? "COMPRESS & SAVE" : "COMMIT TO GARAGE"}
                </button>
              </form>
            </div>
          )}
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4 mt-12">
            <span className="text-xs self-center mr-4 text-neutral-600 uppercase tracking-widest">Filter by:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all skew-x-[-10deg] ${
                  filter === cat 
                    ? 'bg-yellow-600 text-black border-yellow-600' 
                    : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
                }`}
              >
                <span className="block skew-x-[10deg]">{cat}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Grid */}
        <main className="pb-32">
          {loading ? (
            <div className="text-center py-20 text-neutral-600 animate-pulse">
              LOADING_ASSETS...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => openLightbox(item)}
                  className={`group relative cursor-pointer bg-neutral-900 p-3 shadow-xl transition-all duration-500 hover:z-10 hover:scale-105 hover:rotate-0 ${item.rotation || 'rotate-0'}`}
                >
                  {isUnlocked && (
                    <button 
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="absolute -top-2 -right-2 z-30 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-yellow-500/20 backdrop-blur-sm rotate-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="aspect-[4/5] overflow-hidden bg-black relative">
                    <img 
                      src={item.url} 
                      alt={item.filename} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="font-mono text-xs text-yellow-500 mb-1">
                        {item.filename}
                      </div>
                      <div className="flex justify-between items-end text-neutral-300 text-xs">
                        <span>{item.location}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 font-sans text-xs text-neutral-500 italic group-hover:text-neutral-300">
                    "{item.description}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
             <div className="py-32 border-2 border-dashed border-neutral-800 rounded-lg flex flex-col items-center justify-center text-neutral-600 gap-4">
                <Wrench className="w-8 h-8 mb-2" />
                <span>NOTHING ON THE BENCH MATCHING THAT TAG.</span>
             </div>
          )}
        </main>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/95 p-4 backdrop-blur-md" onClick={closeLightbox}>
          <div className="absolute top-4 right-4 text-xs text-neutral-500">
             PRESS [ESC] OR TAP TO CLOSE
          </div>

          <div 
            className="max-w-7xl w-full flex flex-col lg:flex-row gap-12 items-center" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.filename} 
                className="max-h-[80vh] shadow-2xl border border-neutral-800"
              />
              <div className="absolute -bottom-8 left-0 text-[10px] text-neutral-600 tracking-widest uppercase">
                Source: {selectedImage.filename}
              </div>
            </div>

            <div className="lg:w-80 text-left space-y-8">
              <div>
                <h2 className="text-2xl text-white font-bold mb-2">{selectedImage.category}</h2>
                <div className="h-1 w-12 bg-yellow-600"></div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">DATE CAPTURED</span>
                  <span className="text-neutral-300">{selectedImage.date}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">LOCATION</span>
                  <span className="text-neutral-300">{selectedImage.location}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">TIME</span>
                  <span className="text-neutral-300">{selectedImage.time}</span>
                </div>
              </div>

              <p className="text-neutral-400 leading-relaxed text-sm italic border-l-2 border-neutral-800 pl-4">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* On This Day Modal */}
      {showMemories && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center" onClick={() => setShowMemories(false)}>
           <button className="absolute top-6 right-6 text-white p-2 hover:bg-neutral-800 rounded-full">
             <X />
           </button>

           <div className="max-w-md w-full bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-neutral-800" onClick={e => e.stopPropagation()}>
              <div className="bg-yellow-600 p-4 flex items-center gap-3 text-black">
                 <History className="w-5 h-5" />
                 <div className="font-bold tracking-wider uppercase text-sm">Flashback</div>
              </div>
              
              <div className="p-0">
                 <div className="relative aspect-square">
                    <img src={memories[0].url} className="w-full h-full object-cover" alt="Memory" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                       <div className="inline-block bg-white text-black text-xs font-bold px-3 py-1 rounded-full mb-4">
                          {getYearsAgo(memories[0].date)} today
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-2">{new Date(memories[0].date).getFullYear()}</h3>
                       <p className="text-neutral-300 text-sm italic">"{memories[0].description}"</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}