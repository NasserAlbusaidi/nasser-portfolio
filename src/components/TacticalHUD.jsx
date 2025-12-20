import React, { useState, useEffect, useMemo } from 'react';
import { Wifi, Activity, Zap } from 'lucide-react';

const IRONMAN_DATE = new Date(import.meta.env.VITE_IRONMAN_DATE);

const TacticalHUD = ({ wellnessLogs = [] }) => {
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

    // --- MISSION CLOCK COUNTDOWN ---
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const diff = IRONMAN_DATE - now;

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
                return;
            }

            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                mins: Math.floor((diff / (1000 * 60)) % 60),
                secs: Math.floor((diff / 1000) % 60)
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- STRESS SCORE CALCULATION ---
    const stressData = useMemo(() => {
        if (!wellnessLogs || wellnessLogs.length === 0) {
            return { score: null, status: 'NO_DATA' };
        }

        // Sort by date, newest first
        const sorted = [...wellnessLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get today's HRV
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntry = sorted.find(log => log.date === todayStr);

        // Get last 7 days of HRV
        const last7Days = sorted.slice(0, 7);
        const hrvValues = last7Days.filter(log => log.hrv).map(log => log.hrv);

        if (!todayEntry?.hrv || hrvValues.length < 3) {
            return { score: null, status: 'INSUFFICIENT_DATA' };
        }

        const avgHrv = hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length;
        const todayHrv = todayEntry.hrv;

        // Stress score: lower HRV = higher stress
        // Score is % difference from average (positive = recovered, negative = stressed)
        const percentDiff = ((todayHrv - avgHrv) / avgHrv) * 100;

        let status = 'NOMINAL';
        if (percentDiff < -15) status = 'ELEVATED';
        else if (percentDiff < -5) status = 'MODERATE';
        else if (percentDiff > 10) status = 'OPTIMAL';

        return {
            score: Math.round(percentDiff),
            status,
            todayHrv: Math.round(todayHrv),
            avgHrv: Math.round(avgHrv)
        };
    }, [wellnessLogs]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPTIMAL': return 'text-cyan-400';
            case 'NOMINAL': return 'text-neon-green';
            case 'MODERATE': return 'text-yellow-500';
            case 'ELEVATED': return 'text-red-500';
            default: return 'text-neutral-500';
        }
    };

    return (
        <div className="fixed top-16 left-0 right-0 z-40 border-b border-neutral-800/50 bg-black/40 backdrop-blur-md">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-6 h-10 flex items-center justify-between text-[9px] md:text-[10px] font-mono tracking-wider">

                {/* CONNECTIVITY STATUS */}
                <div className="flex items-center gap-2">
                    <div className="relative flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#00FF41]"></div>
                        <Wifi className="w-3 h-3 text-neon-green opacity-60" />
                    </div>
                    <span className="text-neutral-500">SYNC_LINK:</span>
                    <span className="text-neon-green font-bold">ACTIVE</span>
                </div>

                {/* MISSION CLOCK */}
                <div className="hidden sm:flex items-center gap-3">
                    <Activity className="w-3 h-3 text-orange-500" />
                    <span className="text-neutral-500">T-MINUS:</span>
                    <div className="flex items-center gap-1 text-white font-bold">
                        <span className="bg-neutral-900 px-1.5 py-0.5 border border-neutral-800">{String(countdown.days).padStart(2, '0')}</span>
                        <span className="text-neutral-600">:</span>
                        <span className="bg-neutral-900 px-1.5 py-0.5 border border-neutral-800">{String(countdown.hours).padStart(2, '0')}</span>
                        <span className="text-neutral-600">:</span>
                        <span className="bg-neutral-900 px-1.5 py-0.5 border border-neutral-800">{String(countdown.mins).padStart(2, '0')}</span>
                        <span className="text-neutral-600">:</span>
                        <span className="bg-neutral-900 px-1.5 py-0.5 border border-neutral-800 text-orange-500">{String(countdown.secs).padStart(2, '0')}</span>
                    </div>
                </div>

                {/* STRESS SCORE */}
                <div className="flex items-center gap-2">
                    <Zap className={`w-3 h-3 ${getStatusColor(stressData.status)}`} />
                    <span className="text-neutral-500">LOAD:</span>
                    {stressData.score !== null ? (
                        <span className={`font-bold ${getStatusColor(stressData.status)}`}>
                            {stressData.score > 0 ? '+' : ''}{stressData.score}%
                            <span className="ml-1 opacity-70">[{stressData.status}]</span>
                        </span>
                    ) : (
                        <span className="text-neutral-600">[{stressData.status}]</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TacticalHUD;
