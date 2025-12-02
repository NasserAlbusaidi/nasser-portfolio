import React from 'react';
import { Timer, TrendingUp, AlertTriangle } from 'lucide-react';
import { useRacePrediction } from '../../hooks/useRacePrediction';
import { formatTime } from '../../utils/time';
import SplitCard from './SplitCard';

const RacePredictor = ({ logs }) => {
    const prediction = useRacePrediction(logs);

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
                <SplitCard
                    type="Swim"
                    time={prediction.swim.time}
                    label={prediction.swim.label}
                    subtext={`${prediction.swim.pace.toFixed(1)} /100m`}
                    colorClass="text-blue-500"
                />
                <SplitCard
                    type="Bike"
                    time={prediction.bike.time}
                    label={prediction.bike.label}
                    subtext={`${prediction.bike.speed.toFixed(1)} km/h`}
                    colorClass="text-orange-500"
                />
                <SplitCard
                    type="Run"
                    time={prediction.run.time}
                    label={prediction.run.label}
                    subtext={`${prediction.run.pace.toFixed(1)} /km`}
                    colorClass="text-emerald-500"
                />
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