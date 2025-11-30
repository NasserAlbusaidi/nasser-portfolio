import React from 'react';
import PropTypes from 'prop-types';
import { Footprints, Bike, Waves, Zap, Trophy } from 'lucide-react';

const PersonalRecords = ({ prData }) => {
  if (!prData) return null;

  // Format Helper: "2025-11-26" -> "NOV 26, 2025"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).toUpperCase();
  };

  const records = [
    { label: "Longest Run", value: prData.longestRun?.value, unit: "KM", icon: Footprints, date: prData.longestRun?.date, color: "text-emerald-400", bg: "bg-emerald-500" },
    { label: "Longest Ride", value: prData.longestBike?.value, unit: "KM", icon: Bike, date: prData.longestBike?.date, color: "text-orange-400", bg: "bg-orange-500" },
    { label: "Longest Swim", value: prData.longestSwim?.value, unit: "KM", icon: Waves, date: prData.longestSwim?.date, color: "text-blue-400", bg: "bg-blue-500" },
    { label: "Max Power", value: prData.highestMaxPower?.value, unit: "W", icon: Zap, date: prData.highestMaxPower?.date, color: "text-yellow-400", bg: "bg-yellow-500" },
  ];

  return (
    <div className="w-full font-mono">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Trophy className="w-4 h-4 text-gray-500" />
        <h3 className="text-lg font-bold text-gray-200">Personal Records</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {records.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <div key={index} className="group relative flex flex-col items-center justify-center p-6 bg-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#444] hover:bg-[#0f0f0f]">
              
              {/* Subtle ambient glow behind the icon */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 ${rec.bg} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />

              <Icon className={`w-8 h-8 mb-3 ${rec.color} relative z-10`} strokeWidth={1.5} />

              <div className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mb-2">{rec.label}</div>

              <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-3xl font-bold text-white tracking-tighter">
                  {rec.value > 0 ? rec.value.toFixed(1) : '--'}
                </span>
                <span className="text-xs text-neutral-600 font-bold">{rec.unit}</span>
              </div>

              {rec.date && rec.value > 0 && (
                <div className="mt-4 text-[9px] text-neutral-500 font-bold border border-[#333] px-2 py-1 bg-[#050505] tracking-widest uppercase">
                  {formatDate(rec.date)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

PersonalRecords.propTypes = {
  prData: PropTypes.shape({
    longestRun: PropTypes.shape({ value: PropTypes.number, date: PropTypes.string }),
    longestBike: PropTypes.shape({ value: PropTypes.number, date: PropTypes.string }),
    longestSwim: PropTypes.shape({ value: PropTypes.number, date: PropTypes.string }),
    highestMaxPower: PropTypes.shape({ value: PropTypes.number, date: PropTypes.string }),
  }).isRequired
};

export default PersonalRecords;