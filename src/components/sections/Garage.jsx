import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../App'; // We'll need to export db from App or move it to a separate file
import { useNotification } from '../../contexts/NotificationContext';

const CATEGORIES = ["All", "Landscape", "Portrait", "Street", "Workout", "Events", "Misc"];

export default function Garage() {
    const { portfolioItems, filter, setFilter, setSelectedImage, isUnlocked, setConfirmationModal, setEditingPhoto, toggleModal } = useStore();
    const { addNotification } = useNotification();

    const handleDelete = async (id) => {
        setConfirmationModal({
            isOpen: true,
            title: 'CONFIRM DELETION',
            message: `Are you sure you want to permanently scrap this entry? LOG_ID: ${id.slice(0, 8).toUpperCase()}`,
            onConfirm: async () => {
                await deleteDoc(doc(db, 'garage_items', id));
                addNotification("Entry successfully scrapped.", "success");
            }
        });
    };

    return (
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
                        {isUnlocked && (
                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setEditingPhoto({ ...item }); toggleModal('editPhoto', true); }} className="bg-neutral-800 text-white p-2 hover:bg-neon-green hover:text-black border border-neutral-700 transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="bg-red-600 text-white p-2 hover:bg-red-700 border border-red-900"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
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
    );
}
