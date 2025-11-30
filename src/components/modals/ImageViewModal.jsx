import React from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function ImageViewModal() {
    const { selectedImage, setSelectedImage } = useStore();

    if (!selectedImage) return null;

    return (
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
    );
}
