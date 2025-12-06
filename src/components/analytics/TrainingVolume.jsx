import React, { useState, useMemo } from 'react';
import { Lock, Flame, Clock, Waves, Bike, Footprints, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';

// Training plan dates
const TRAINING_START = new Date('2025-11-20');
const RACE_DAY = new Date('2026-02-14');
const TOTAL_WEEKS = 12;

// Rough calorie estimates per km/min
const CALORIE_RATES = {
    swim: 60,  // per km
    bike: 30,  // per km
    run: 65,   // per km
    workout: 6 // per min
};

export default function TrainingVolume({ trainingLogs }) {
    // Calculate current week number (1-12)
    const getCurrentWeek = () => {
        const now = new Date();
        const diffTime = now - TRAINING_START;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.min(TOTAL_WEEKS, Math.max(1, Math.ceil((diffDays + 1) / 7)));
    };

    const currentWeek = getCurrentWeek();
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);

    // Get week date range
    const getWeekDates = (weekNum) => {
        const start = new Date(TRAINING_START);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
    };

    // Filter logs for selected week
    const weekLogs = useMemo(() => {
        const { start, end } = getWeekDates(selectedWeek);

        return trainingLogs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= start && logDate <= end;
        });
    }, [trainingLogs, selectedWeek]);

    // Calculate stats for selected week
    const stats = useMemo(() => {
        const totals = {
            swim: 0,
            bike: 0,
            run: 0,
            workout: 0,
            totalTime: 0,
            calories: 0,
            sessions: 0
        };

        weekLogs.forEach(log => {
            const distance = parseFloat(log.distance) || 0;
            const duration = parseFloat(log.duration) || 0;

            totals.totalTime += duration;
            totals.sessions += 1;

            switch (log.activityType) {
                case 'swim':
                    totals.swim += distance;
                    totals.calories += distance * CALORIE_RATES.swim;
                    break;
                case 'bike':
                    totals.bike += distance;
                    totals.calories += distance * CALORIE_RATES.bike;
                    break;
                case 'run':
                    totals.run += distance;
                    totals.calories += distance * CALORIE_RATES.run;
                    break;
                case 'workout':
                    totals.workout += duration;
                    totals.calories += duration * CALORIE_RATES.workout;
                    break;
            }
        });

        return totals;
    }, [weekLogs]);

    // Format time as hours and minutes
    const formatTime = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hrs === 0) return `${mins}m`;
        return `${hrs}h ${mins}m`;
    };

    // Format date range
    const formatDateRange = (weekNum) => {
        const { start, end } = getWeekDates(weekNum);
        const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    return (
        <div className="w-full bg-[#080808] border border-neutral-800 p-4 md:p-6">
            {/* Week Selector Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
                    TRAINING VOLUME
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                    {formatDateRange(selectedWeek)}
                </div>
            </div>

            {/* Week Pills */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(week => {
                    const isLocked = week > currentWeek;
                    const isSelected = week === selectedWeek;
                    const isCurrent = week === currentWeek;

                    return (
                        <button
                            key={week}
                            onClick={() => !isLocked && setSelectedWeek(week)}
                            disabled={isLocked}
                            className={`
                                relative flex-shrink-0 w-10 h-10 flex items-center justify-center
                                text-xs font-mono font-bold transition-all
                                ${isLocked
                                    ? 'bg-neutral-900/50 text-neutral-700 cursor-not-allowed border border-neutral-900'
                                    : isSelected
                                        ? 'bg-neon-orange text-black border border-neon-orange shadow-[0_0_15px_rgba(255,95,0,0.3)]'
                                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white'
                                }
                                ${isCurrent && !isSelected ? 'ring-1 ring-neon-orange/50' : ''}
                            `}
                        >
                            {isLocked ? (
                                <Lock className="w-3 h-3" />
                            ) : (
                                <span>{week}</span>
                            )}
                            {isCurrent && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Week Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* Swim */}
                <div className="bg-black/50 border border-neutral-900 p-3 text-center">
                    <Waves className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                    <div className="text-lg font-bold text-white">{stats.swim.toFixed(1)}</div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">km swim</div>
                </div>

                {/* Bike */}
                <div className="bg-black/50 border border-neutral-900 p-3 text-center">
                    <Bike className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                    <div className="text-lg font-bold text-white">{stats.bike.toFixed(1)}</div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">km bike</div>
                </div>

                {/* Run */}
                <div className="bg-black/50 border border-neutral-900 p-3 text-center">
                    <Footprints className="w-5 h-5 mx-auto mb-2 text-green-500" />
                    <div className="text-lg font-bold text-white">{stats.run.toFixed(1)}</div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">km run</div>
                </div>

                {/* Gym */}
                <div className="bg-black/50 border border-neutral-900 p-3 text-center">
                    <Dumbbell className="w-5 h-5 mx-auto mb-2 text-red-500" />
                    <div className="text-lg font-bold text-white">{stats.workout}</div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">min gym</div>
                </div>
            </div>

            {/* Bottom Summary Row */}
            <div className="flex items-center justify-between border-t border-neutral-900 pt-4 text-xs font-mono">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-white font-bold">{formatTime(stats.totalTime)}</span>
                        <span className="text-neutral-600">total</span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400">
                        <Flame className="w-4 h-4 text-red-500" />
                        <span className="text-white font-bold">{Math.round(stats.calories).toLocaleString()}</span>
                        <span className="text-neutral-600">cal</span>
                    </div>
                </div>

                <div className="text-neutral-500">
                    <span className="text-white font-bold">{stats.sessions}</span> sessions
                </div>
            </div>
        </div>
    );
}
