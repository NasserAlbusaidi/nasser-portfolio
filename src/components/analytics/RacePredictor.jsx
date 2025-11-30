import React, { useMemo } from 'react';
import { Timer, TrendingUp, AlertTriangle } from 'lucide-react';

const RacePredictor = ({ logs }) => {
    
    const prediction = useMemo(() => {
        // 1. Filter logs to last 90 days for relevance
        const now = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);

        const recentLogs = logs.filter(l => new Date(l.date) >= ninetyDaysAgo);

        // 2. Helper to get avg speed (km/h) for a type
        const getAvgSpeed = (type) => {
            const typeLogs = recentLogs.filter(l => l.activityType === type && parseFloat(l.distance) > 0 && parseFloat(l.duration) > 0);
            if (typeLogs.length === 0) return 0;
            
            // Sum total distance and duration for weighted average
            const totalDist = typeLogs.reduce((acc, curr) => acc + parseFloat(curr.distance), 0);
            const totalDur = typeLogs.reduce((acc, curr) => acc + parseFloat(curr.duration), 0); // mins
            
            return totalDist / (totalDur / 60); // km per hour
        };

        const swimSpeed = getAvgSpeed('swim');
        const bikeSpeed = getAvgSpeed('bike');
        const runSpeed = getAvgSpeed('run');

        // 3. Project 70.3 Times (Distances fixed for Ironman 70.3)
        // Swim 1.9km, Bike 90km, Run 21.1km
        const swimTime = swimSpeed > 0 ? 1.9 / swimSpeed : 0;
        const bikeTime = bikeSpeed > 0 ? 90 / bikeSpeed : 0;
        const runTime = runSpeed > 0 ? 21.1 / runSpeed : 0;
        
        // Transitions (Estimate 10 mins total for T1+T2 if no data)
        const transitionTime = 10 / 60; 

        const totalTime = swimTime + bikeTime + runTime + (swimTime && bikeTime && runTime ? transitionTime : 0);

        return {
            swim: { time: swimTime, speed: swimSpeed, label: '1.9 KM' },
            bike: { time: bikeTime, speed: bikeSpeed, label: '90 KM' },
            run:  { time: runTime, speed: runSpeed, label: '21.1 KM' },
            total: totalTime
        };
    }, [logs]);

    // Helper to format hours (1.5 -> 1h 30m)
    const formatTime = (decimalHours) => {
        if (!decimalHours || decimalHours === 0) return "--";
        const hrs = Math.floor(decimalHours);
        const mins = Math.round((decimalHours - hrs) * 60);
        return `${hrs}:${mins.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-[#0a0a0a] border border-neutral-800 p-6 font-mono flex flex-col h-full relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 uppercase">
                    <Timer className="w-4 h-4" /> Performance Forecast
                </div>
                <div className="text-[10px] text-neutral-600 uppercase tracking-wider">
                    Protocol: 70.3
                </div>
            </div>

            {/* Main Projection */}
            <div className="flex-1 flex flex-col justify-center items-center py-4 relative z-10">
                <div className="text-neutral-500 text-xs uppercase tracking-[0.3em] mb-2">Estimated Finish Time</div>
                <div className="text-5xl md:text-6xl font-bold text-white tracking-tighter relative">
                    {formatTime(prediction.total)}
                    {prediction.total > 0 && <span className="text-sm text-neutral-600 absolute -right-8 top-2">HRS</span>}
                </div>
                
                {/* Goal Delta (Optional flourish) */}
                {prediction.total > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-neon-green bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
                        <TrendingUp className="w-3 h-3" /> 
                        <span>BASED ON LAST 90 DAYS</span>
                    </div>
                )}
            </div>

            {/* Splits Grid */}
            <div className="grid grid-cols-3 gap-2 mt-6 border-t border-neutral-800 pt-6">
                {/* Swim */}
                <div className="bg-neutral-900/30 p-3 border border-neutral-800 flex flex-col items-center justify-center">
                    <div className="text-[9px] text-blue-500 uppercase tracking-widest mb-1">Swim</div>
                    <div className="text-xl font-bold text-white">{formatTime(prediction.swim.time)}</div>
                    <div className="text-[8px] text-neutral-600">{prediction.swim.label}</div>
                </div>
                
                {/* Bike */}
                <div className="bg-neutral-900/30 p-3 border border-neutral-800 flex flex-col items-center justify-center">
                    <div className="text-[9px] text-orange-500 uppercase tracking-widest mb-1">Bike</div>
                    <div className="text-xl font-bold text-white">{formatTime(prediction.bike.time)}</div>
                    <div className="text-[8px] text-neutral-600">{prediction.bike.label}</div>
                </div>

                {/* Run */}
                <div className="bg-neutral-900/30 p-3 border border-neutral-800 flex flex-col items-center justify-center">
                    <div className="text-[9px] text-emerald-500 uppercase tracking-widest mb-1">Run</div>
                    <div className="text-xl font-bold text-white">{formatTime(prediction.run.time)}</div>
                    <div className="text-[8px] text-neutral-600">{prediction.run.label}</div>
                </div>
            </div>

            {/* Warning if data insufficient */}
            {prediction.total === 0 && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                        <div className="text-xs text-neutral-400 uppercase tracking-widest">Insufficient Data</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RacePredictor;