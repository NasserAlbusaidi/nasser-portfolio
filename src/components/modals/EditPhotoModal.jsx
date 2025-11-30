import React, { useState } from 'react';
import { Pencil, X, Save, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNotification } from '../../contexts/NotificationContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../App';

const CATEGORIES = ["All", "Landscape", "Portrait", "Street", "Workout", "Events", "Misc"];

export default function EditPhotoModal() {
    const { modals, toggleModal, editingPhoto, setEditingPhoto, user, isUnlocked } = useStore();
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);

    if (!modals.editPhoto || !editingPhoto) return null;

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!user || !isUnlocked || !editingPhoto) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'garage_items', editingPhoto.id), {
                filename: editingPhoto.filename,
                description: editingPhoto.description,
                category: editingPhoto.category,
                updatedAt: serverTimestamp()
            });
            addNotification("Asset updated.", "success");
            setEditingPhoto(null);
            toggleModal('editPhoto', false);
        } catch (error) {
            console.error(error);
            addNotification("Update failed.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#050505] border-2 border-neon-orange p-6 rounded-none shadow-[0_0_30px_rgba(255,95,0,0.2)] max-w-md w-full relative">
                <button onClick={() => toggleModal('editPhoto', false)} className="absolute top-4 right-4 text-neon-orange hover:text-white"><X className="w-6 h-6" /></button>
                <h3 className="text-neon-orange font-bold mb-6 flex items-center gap-2 tracking-widest uppercase"><Pencil className="w-4 h-4" /> EDIT_ASSET // {editingPhoto.id.slice(0, 8)}</h3>
                <form onSubmit={handleUpdate} className="space-y-4 font-mono">
                    <div>
                        <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Title (Filename)</label>
                        <input required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingPhoto.filename} onChange={e => setEditingPhoto({ ...editingPhoto, filename: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Category</label>
                        <select className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingPhoto.category} onChange={e => setEditingPhoto({ ...editingPhoto, category: e.target.value })}>
                            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-neon-orange uppercase block mb-1 tracking-widest">Description</label>
                        <textarea rows="3" className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-neon-orange" value={editingPhoto.description} onChange={e => setEditingPhoto({ ...editingPhoto, description: e.target.value })} />
                    </div>
                    <button disabled={isSaving} className="w-full bg-neon-orange hover:bg-white text-black font-bold text-xs py-4 tracking-[0.2em] flex items-center justify-center gap-2 transition-colors">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isSaving ? "SAVING..." : "CONFIRM_UPDATE"}
                    </button>
                </form>
            </div>
        </div>
    );
}
