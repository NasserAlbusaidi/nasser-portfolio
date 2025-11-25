import React from 'react';
import { Footprints, Bike, Waves, Zap } from 'lucide-react';

const PersonalRecords = ({ prData }) => {
  const prs = [
    { label: "Longest Run", value: prData.longestRun.value, unit: "KM", icon: Footprints, date: prData.longestRun.date },
    { label: "Longest Ride", value: prData.longestBike.value, unit: "KM", icon: Bike, date: prData.longestBike.date },
    { label: "Longest Swim", value: prData.longestSwim.value, unit: "KM", icon: Waves, date: prData.longestSwim.date },
    { label: "Highest Max Power", value: prData.highestMaxPower.value, unit: "W", icon: Zap, date: prData.highestMaxPower.date },
  ];

  return (
    <div className="flex flex-col items-center p-4 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-lg w-full max-w-4xl mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Personal Records</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {prs.map((pr, index) => {
          const Icon = pr.icon;
          return (
            <div key={index} className="flex flex-col items-center justify-center p-4 bg-black border border-neutral-900 rounded-md">
              <Icon className="w-8 h-8 text-neon-green mb-2" />
              <div className="text-xs text-neutral-400 uppercase tracking-widest">{pr.label}</div>
              <div className="text-2xl font-bold text-white mt-1">
                {pr.value > 0 ? `${pr.value.toFixed(1)} ${pr.unit}` : '--'}
              </div>
              {pr.date && pr.value > 0 && <div className="text-[10px] text-neutral-600 mt-1">{pr.date}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalRecords;
