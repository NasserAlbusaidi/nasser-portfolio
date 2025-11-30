import React, { useState, useEffect } from 'react';
import { Activity, Flag, Waves, Bike, Dumbbell, Footprints, Pencil, Trash2 } from 'lucide-react';
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
        <section id="roadmap" className="py-24 px-6 border-t border-neutral-800 min-h-screen bg-[#0a0a0a]">
            <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 mb-16">
                <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orange-900/20 text-orange-500 text-xs font-bold mb-4"><Activity className="w-3 h-3" /> ACTIVE MISSION</div>
                    <h1 className="text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tighter font-orbitron uppercase">Road to Ironman.</h1>
                    <p className="text-sm text-neutral-500 max-w-lg leading-relaxed">Training for the 70.3 mile sufferfest. <br />Feb 14, 2026. No shortcuts.</p>
                </div>
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
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id) }} className="text-neutral-600 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
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
    );
}
