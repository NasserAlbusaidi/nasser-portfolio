import React, { useState } from 'react';
import { Pencil, X, Upload, Loader2, Save } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNotification } from '../../contexts/NotificationContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../App';

export default function EditLogModal() {
    const { modals, toggleModal, editingLog, setEditingLog, user, isUnlocked } = useStore();
    const { addNotification } = useNotification();
    const [imageFile, setImageFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!modals.edit || !editingLog) return null;

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
            toggleModal('edit', false);
        } catch (error) {
            console.error(error);
            addNotification("Update failed.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#050505] border-2 border-neon-orange p-6 rounded-none shadow-[0_0_30px_rgba(255,95,0,0.2)] max-w-md w-full relative">
                <button onClick={() => toggleModal('edit', false)} className="absolute top-4 right-4 text-neon-orange hover:text-white"><X className="w-6 h-6" /></button>
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
    );
}
