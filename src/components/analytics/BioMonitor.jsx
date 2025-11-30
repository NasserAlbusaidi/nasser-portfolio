import React from 'react';
import { Footprints, Heart, Moon, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const BioMonitor = ({ wellnessData }) => {
    // Get last 14 days for trends, last 5 for steps
    const recentData = wellnessData.slice(-14);
    const last5Days = wellnessData.slice(-5);
    const today = wellnessData[wellnessData.length - 1] || {};

    const formatSleep = (secs) => {
        if (!secs) return "--";
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        return `${hrs}h ${mins}m`;
    };

    if (wellnessData.length === 0) return (
        <div className="w-full bg-[#0a0a0a] border border-neutral-800 p-6 flex flex-col items-center justify-center text-neutral-600 space-y-2">
            <Activity className="w-6 h-6" />
            <span className="text-xs uppercase tracking-widest">Awaiting Bio-Telemetry...</span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full font-mono">

            {/* 1. CARDIOVASCULAR STATUS */}
            <div className="bg-[#0a0a0a] border border-neutral-800 p-5 relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-900/10 blur-2xl rounded-full -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold tracking-widest uppercase mb-1">
                            <Heart className="w-3 h-3" /> Resting H.R.
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl text-white font-bold tracking-tighter">
                                {today.restingHR || "--"}
                            </div>
                            <span className="text-xs text-neutral-500 font-bold">BPM</span>
                        </div>
                    </div>
                    {today.hrv && (
                        <div className="text-right">
                            <div className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">HRV (rMSSD)</div>
                            <div className="text-xl text-neutral-300">{today.hrv} <span className="text-[10px] text-neutral-600">ms</span></div>
                        </div>
                    )}
                </div>

                {/* Sparkline for RHR */}
                <div className="h-16 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={recentData}>
                            <defs>
                                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="restingHR"
                                stroke="#EF4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorHr)"
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. ACTIVITY & RECOVERY */}
            <div className="bg-[#0a0a0a] border border-neutral-800 p-5 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-900/10 blur-2xl rounded-full -mr-10 -mt-10"></div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-blue-500 text-[10px] font-bold tracking-widest uppercase mb-1">
                            <Footprints className="w-3 h-3" /> Step Volume
                        </div>
                        <div className="text-2xl text-white font-bold tracking-tighter">
                            {today.steps ? today.steps.toLocaleString() : "--"}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-purple-500 text-[10px] font-bold tracking-widest uppercase mb-1">
                            <Moon className="w-3 h-3" /> Last Sleep
                        </div>
                        <div className="text-xl text-neutral-300">{formatSleep(today.sleepSecs)}</div>
                    </div>
                </div>

                {/* Steps Bar Chart */}
                <div className="h-24 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last5Days} barCategoryGap="20%">
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-black border border-neutral-800 p-2 text-[10px] text-white font-mono shadow-xl">
                                                <span className="text-blue-400">STEPS:</span> {payload[0].value.toLocaleString()}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="steps" radius={[2, 2, 0, 0]} isAnimationActive={true}>
                                {last5Days.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === last5Days.length - 1 ? '#3B82F6' : '#1e293b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default BioMonitor;