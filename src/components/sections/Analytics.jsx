import React, { useMemo } from 'react';
import { Activity, Database } from 'lucide-react';
import { useStore } from '../../store/useStore';
import MissionOverview from '../analytics/HeatmapCalendar';
import ProgressCharts from '../analytics/ProgressCharts';
import PersonalRecords from '../analytics/PersonalRecords';
import BioMonitor from '../analytics/BioMonitor'; // <--- NEW IMPORT
import RacePredictor from '../analytics/RacePredictor';

export default function Analytics() {
    const { trainingLogs, wellnessLogs } = useStore(); // <--- Get wellnessLogs

    // --- DATA PROCESSING ---
    const dailyActivityTotals = useMemo(() => {
        const totals = {};
        trainingLogs.forEach(log => {
            const date = log.date;
            const distance = parseFloat(log.distance) || 0;
            if (totals[date]) {
                totals[date] += distance;
            } else {
                totals[date] = distance;
            }
        });
        return totals;
    }, [trainingLogs]);

    const weeklyChartData = useMemo(() => {
        const data = {};
        trainingLogs.forEach(log => {
            const logDate = new Date(log.date);
            const weekStart = new Date(logDate);
            weekStart.setDate(logDate.getDate() - (logDate.getDay() + 6) % 7);
            weekStart.setHours(0, 0, 0, 0);

            const weekKey = weekStart.toISOString().split('T')[0];

            if (!data[weekKey]) {
                data[weekKey] = { week: weekKey, swim: 0, bike: 0, run: 0, workout: 0 };
            }

            const value = parseFloat(log.distance) || parseFloat(log.duration) || 0;
            data[weekKey][log.activityType] += value;
        });
        return Object.values(data).sort((a, b) => new Date(a.week) - new Date(b.week));
    }, [trainingLogs]);

    const personalRecords = useMemo(() => {
        const prs = {
            longestRun: { value: 0, date: null, id: null },
            longestBike: { value: 0, date: null, id: null },
            longestSwim: { value: 0, date: null, id: null },
            highestMaxPower: { value: 0, date: null, id: null },
        };

        trainingLogs.forEach(log => {
            const distance = parseFloat(log.distance) || 0;
            const maxPower = parseFloat(log.maxPower) || 0;

            if (log.activityType === 'run' && distance > prs.longestRun.value) {
                prs.longestRun = { value: distance, date: log.date, id: log.id };
            } else if (log.activityType === 'bike' && distance > prs.longestBike.value) {
                prs.longestBike = { value: distance, date: log.date, id: log.id };
            } else if (log.activityType === 'swim' && distance > prs.longestSwim.value) {
                prs.longestSwim = { value: distance, date: log.date, id: log.id };
            }

            if (log.activityType === 'bike' && maxPower > prs.highestMaxPower.value) {
                prs.highestMaxPower = { value: maxPower, date: log.date, id: log.id };
            }
        });

        return prs;
    }, [trainingLogs]);

    return (
        <section id="analytics" className="py-24 border-t border-neutral-800 min-h-screen bg-[#050505] relative">
            <div className="absolute top-0 left-0 right-0 h-96 bg-[linear-gradient(to_bottom,rgba(255,95,0,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(255,95,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-neon-orange text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
                            <Activity className="w-4 h-4" /> System Metrics
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase font-orbitron">
                            Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-neutral-700">Analytics</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-mono border border-neutral-800 px-3 py-1 bg-[#0a0a0a]">
                        <Database className="w-3 h-3" />
                    DATABASE_STATUS: <span className="text-neon-green">ONLINE</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Row 1: Mission Overview (Full Width) */}
                    <MissionOverview activityData={dailyActivityTotals} year={new Date().getFullYear()} />

                    {/* Row 2: Bio Monitor (Full Width) */}
                    <BioMonitor wellnessData={wellnessLogs} />

                    {/* Row 3: The Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Volume Chart (Span 7/12) */}
                        <div className="lg:col-span-7 flex flex-col">
                            {/* We remove margin-top from chart component to fit perfectly */}
                            <div className="h-full">
                                <ProgressCharts chartData={weeklyChartData} />
                            </div>
                        </div>

                        {/* Right Column: Records & Forecast (Span 5/12) */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <PersonalRecords prData={personalRecords} />
                            
                            {/* Forecast fills remaining height naturally */}
                            <div className="flex-1 min-h-[250px]">
                                <RacePredictor logs={trainingLogs} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}