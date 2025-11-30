import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import HeatmapCalendar from '../analytics/HeatmapCalendar';
import ProgressCharts from '../analytics/ProgressCharts';
import PersonalRecords from '../analytics/PersonalRecords';

export default function Analytics() {
    const { trainingLogs } = useStore();

    // --- ANALYTICS DATA PROCESSING ---
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

    // --- WEEKLY CHART DATA PROCESSING ---
    const weeklyChartData = useMemo(() => {
        const data = {};
        trainingLogs.forEach(log => {
            const logDate = new Date(log.date);
            const weekStart = new Date(logDate);
            weekStart.setDate(logDate.getDate() - (logDate.getDay() + 6) % 7); // Adjust to Monday
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

    // --- PERSONAL RECORDS PROCESSING ---
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
        <section id="analytics" className="py-24 px-6 border-t border-neutral-800 min-h-screen bg-[#050505]">
            <h1 className="text-5xl font-bold text-white text-center mb-12">Mission Analytics</h1>
            <div className="flex justify-center mb-12">
                <HeatmapCalendar activityData={dailyActivityTotals} year={new Date().getFullYear()} />
            </div>
            <ProgressCharts chartData={weeklyChartData} />
            <PersonalRecords prData={personalRecords} />
        </section>
    );
}
