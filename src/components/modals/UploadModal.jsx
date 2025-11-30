import React, { useState } from 'react';
import { Upload, X, RefreshCw, Loader2, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNotification } from '../../contexts/NotificationContext';
import { extractExif } from '../../utils/exif';
import { reverseGeocode } from '../../utils/geocoding';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../App';

const CATEGORIES = ["All", "Landscape", "Portrait", "Street", "Workout", "Events", "Misc"];

export default function UploadModal() {
    const { modals, toggleModal, user, isUnlocked } = useStore();
    const { addNotification } = useNotification();

    const [uploadType, setUploadType] = useState("training");
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [newItem, setNewItem] = useState({
        filename: '', date: new Date().toISOString().split('T')[0], time: '12:00', category: 'Street',
        location: '', description: '', rotation: 'rotate-0', activityType: 'run', distance: 0, duration: ''
    });

    if (!modals.upload) return null;

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
            toggleModal('upload', false);
        } catch (error) {
            console.error(error);
            addNotification("Upload failed.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-30">
            <div className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] bg-neutral-900 border border-neutral-700 p-6 rounded-lg shadow-2xl animate-in slide-in-from-bottom-10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> UPLOAD CENTER</h3>
                <div className="flex gap-2 mb-4 p-1 bg-black rounded">
                    <button onClick={() => setUploadType('portfolio')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${uploadType === 'portfolio' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Portfolio</button>
                    <button onClick={() => setUploadType('training')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded ${uploadType === 'training' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Training</button>
                </div>
                <div className="mb-4"><button onClick={() => { toggleModal('upload', false); toggleModal('sync', true); }} className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-500 border border-blue-900/50 p-2 rounded text-[10px] font-bold uppercase flex items-center justify-center gap-2"><RefreshCw className="w-3 h-3" /> Sync from Intervals.icu</button></div>
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
        </div>
    );
}
