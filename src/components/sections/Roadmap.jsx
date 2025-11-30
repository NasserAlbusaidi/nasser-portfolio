import React, { useState, useEffect } from 'react';
import { Activity, Flag, Waves, Bike, Dumbbell, Footprints, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Countdown from '../system/Countdown';
import HolographicGauge from '../HolographicGauge';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../App';
import { useNotification } from '../../contexts/NotificationContext';

const IRONMAN_DATE = new Date(import.meta.env.VITE_IRONMAN_DATE);
const TARGETS = {
    swim: Number(import.meta.env.VITE_TARGET_SWIM),
    bike: Number(import.meta.env.VITE_TARGET_BIKE),
    run: Number(import.meta.env.VITE_TARGET_RUN),
    workout: Number(import.meta.env.VITE_TARGET_WORKOUT)
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

export default function Roadmap() {
    const { trainingLogs, isUnlocked, setSelectedLog, setEditingLog, toggleModal, setConfirmationModal } = useStore();
    const { addNotification } = useNotification();
    
    // --- NEW STATE FOR EXPANSION ---
    const [isExpanded, setIsExpanded] = useState(false);
    const INITIAL_LIMIT = 7;

    // Derived visible logs based on state
    const visibleLogs = isExpanded ? trainingLogs : trainingLogs.slice(0, INITIAL_LIMIT);

    const calculateTotals = () => {
        // Calculate based on ALL logs, not just visible ones
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

    const totals = calculateTotals();

    const handleDelete = async (id) => {
        setConfirmationModal({
            isOpen: true,
            title: 'CONFIRM DELETION',
            message: `Are you sure you want to permanently scrap this entry? LOG_ID: ${id.slice(0, 8).toUpperCase()}`,
            onConfirm: async () => {
                await deleteDoc(doc(db, 'ironman_logs', id));
                addNotification("Entry successfully scrapped.", "success");
            }
        });
    };

    const handleEdit = (log) => {
        setEditingLog({ ...log });
        toggleModal('edit', true);
    };

    return (
        <section id="roadmap" className="py-24 px-4 md:px-6 border-t border-neutral-800 min-h-screen bg-[#0a0a0a]">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 mb-16">
                <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orange-900/20 text-orange-500 text-[10px] font-bold mb-4 tracking-widest border border-orange-900/50">
                        <Activity className="w-3 h-3" /> ACTIVE MISSION
                    </div>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tighter font-orbitron uppercase">
                        Road to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Ironman.</span>
                    </h1>
                    <p className="text-xs md:text-sm text-neutral-500 max-w-lg leading-relaxed font-mono">
                        Training for the 70.3 mile sufferfest. <br />Feb 14, 2026. No shortcuts.
                    </p>
                </div>
                <Countdown targetDate={IRONMAN_DATE} />
            </div>

            {/* Gauges Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-24">
                <HolographicGauge value={totals.swim} max={TARGETS.swim} label="SWIM PROTOCOL" unit="KM" color="#3B82F6" />
                <HolographicGauge value={totals.bike} max={TARGETS.bike} label="BIKE PROTOCOL" unit="KM" color="#F97316" />
                <HolographicGauge value={totals.run} max={TARGETS.run} label="RUN PROTOCOL" unit="KM" color="#22C55E" />
                <HolographicGauge value={totals.workout} max={TARGETS.workout} label="GYM PROTOCOL" unit="MIN" color="#EF4444" />
            </div>

            {/* Timeline */}
            <div className="relative max-w-4xl mx-auto">
                {/* Timeline Vertical Line */}
                <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neutral-800 to-transparent transform md:-translate-x-1/2"></div>
                <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-orange-600 to-transparent transform md:-translate-x-1/2 opacity-20 animate-pulse"></div>
                
                {/* Goal Flag (Layout Fixed) */}
                <div className="relative flex flex-row md:flex-col items-center md:justify-center mb-16 pl-16 md:pl-0">
                    <div className="absolute left-6 md:static transform -translate-x-1/2 md:translate-x-0 w-8 h-8 bg-orange-600 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(234,88,12,0.5)] border border-orange-400">
                        <Flag className="w-4 h-4 text-white" />
                    </div>
                    <div className="md:mt-4 text-orange-500 font-bold tracking-[0.3em] text-xs font-mono uppercase bg-[#0a0a0a] px-3 py-1 border border-orange-900/50 shadow-[0_0_15px_rgba(234,88,12,0.2)]">
                        Mission Objective
                    </div>
                </div>

                {/* Logs Rendering */}
                {visibleLogs.map((log, index) => {
                    const isLeft = index % 2 === 0;
                    const Icon = log.activityType === 'swim' ? Waves : log.activityType === 'bike' ? Bike : log.activityType === 'workout' ? Dumbbell : Footprints;
                    const colorClass = log.activityType === 'swim' ? 'text-blue-500' : log.activityType === 'bike' ? 'text-orange-500' : log.activityType === 'workout' ? 'text-red-600' : 'text-green-500';
                    const markerColor = log.activityType === 'swim' ? 'bg-blue-500' : log.activityType === 'bike' ? 'bg-orange-500' : log.activityType === 'workout' ? 'bg-red-500' : 'bg-green-500';

                    return (
                        <RevealOnScroll key={log.id} className={`relative flex flex-col md:flex-row items-start md:items-center mb-12 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                            
                            <div className="absolute left-6 md:left-1/2 w-3 h-3 bg-[#0a0a0a] border border-neutral-600 z-10 transform -translate-x-1.5 md:-translate-x-1.5 mt-6 md:mt-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:border-white transition-colors">
                                <div className={`w-1.5 h-1.5 rounded-full absolute top-0.5 left-0.5 ${markerColor} opacity-80`}></div>
                            </div>

                            <div className="hidden md:block w-1/2"></div>

                            <div 
                                onClick={() => setSelectedLog(log)} 
                                className={`w-full md:w-[45%] pl-16 md:pl-0 ${isLeft ? 'md:pr-12 text-left md:text-right' : 'md:pl-12 text-left'}`}
                            >
                                <div className={`inline-flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest font-mono ${colorClass} ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                                    <Icon className="w-3 h-3" />
                                    <span>{log.activityType} <span className="text-neutral-600">//</span> {log.distance}KM</span>
                                </div>

                                <div className="bg-[#080808] border border-neutral-800 p-5 hover:border-orange-500/50 transition-all group relative overflow-hidden cursor-pointer hover:shadow-[0_0_30px_rgba(255,95,0,0.1)]">
                                    <div className="scanline-sweep"></div>
                                    
                                    {isUnlocked && (
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(log); }} className="text-neutral-600 hover:text-white p-1"><Pencil className="w-3 h-3" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id) }} className="text-neutral-600 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    )}

                                    <div className="text-[9px] text-neutral-600 font-mono mb-3 tracking-widest">ID: {log.id.slice(0, 8).toUpperCase()}</div>
                                    
                                    {log.url && (
                                        <div className="mb-4 overflow-hidden aspect-video border border-neutral-900 relative">
                                            <img src={log.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" alt="Log" />
                                        </div>
                                    )}
                                    
                                    <p className="text-neutral-400 text-xs leading-relaxed mb-4 font-mono line-clamp-3 group-hover:text-neutral-200 transition-colors">
                                        "{log.description}"
                                    </p>
                                    
                                    <div className={`text-[9px] text-neutral-500 uppercase tracking-widest flex gap-4 font-mono border-t border-neutral-900 pt-3 ${isLeft ? 'md:justify-end' : ''}`}>
                                        <span>{log.date}</span>
                                        {log.duration && <span className="text-white">{log.duration} MIN</span>}
                                    </div>
                                </div>
                            </div>
                        </RevealOnScroll>
                    );
                })}

                {/* EXPAND BUTTON / END MARKER */}
                <div className="relative flex flex-col items-center justify-center mt-12 pl-12 md:pl-0 z-20">
                    {trainingLogs.length > INITIAL_LIMIT && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="group flex flex-col items-center gap-3 text-neutral-500 hover:text-orange-500 transition-colors mb-8"
                        >
                            <div className={`h-8 w-px bg-neutral-800 group-hover:bg-orange-500 transition-colors`}></div>
                            <div className="flex items-center gap-2 border border-neutral-800 bg-black px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase group-hover:border-orange-500 transition-all">
                                {isExpanded ? (
                                    <>
                                        <span>COLLAPSE ARCHIVE</span>
                                        <ChevronUp className="w-3 h-3" />
                                    </>
                                ) : (
                                    <>
                                        <span>ACCESS FULL ARCHIVE ({trainingLogs.length - INITIAL_LIMIT}+)</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </>
                                )}
                            </div>
                        </button>
                    )}
                    
                    {/* Final Dot */}
                    <div className="w-2 h-2 rounded-full bg-neutral-800 z-10 absolute bottom-0 left-6 md:left-1/2 transform -translate-x-1"></div>
                </div>

                {trainingLogs.length === 0 && (
                    <div className="text-center py-24 pl-12 md:pl-0">
                        <div className="inline-block border border-dashed border-neutral-800 p-4 text-neutral-600 text-xs font-mono uppercase tracking-widest">
                            Awaiting Mission Data...
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}