import React, { useState, useEffect, useMemo } from 'react';

const HeatmapCalendar = ({ activityData, color = 'bg-neon-green', year = new Date().getFullYear() }) => {
  const [hoveredDate, setHoveredDate] = useState(null);

  const daysInYear = useMemo(() => {
    const dates = [];
    const startDate = new Date(year, 0, 1); // January 1st of the given year
    const endDate = new Date(year, 11, 31); // December 31st of the given year

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }, [year]);

  const maxActivity = useMemo(() => {
    if (Object.keys(activityData).length === 0) return 0;
    return Math.max(...Object.values(activityData));
  }, [activityData]);

  const getActivityIntensity = (date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const distance = activityData[dateString] || 0;
    if (maxActivity === 0) return 0;
    return Math.min(Math.ceil((distance / maxActivity) * 5), 5); // 0-5 intensity levels
  };

  const getDayColor = (intensity) => {
    switch (intensity) {
      case 1: return 'bg-green-900/40 border-green-800/20';
      case 2: return 'bg-green-700/50 border-green-600/30';
      case 3: return 'bg-green-500/60 border-green-400/40';
      case 4: return 'bg-green-400/70 border-green-300/50';
      case 5: return 'bg-green-300/80 border-green-200/60';
      default: return 'bg-neutral-900/20 border-neutral-800/10'; // No activity
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-lg relative">
      <h3 className="text-xl font-bold text-white mb-4">Training Overview: {year}</h3>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {daysInYear.map((date, index) => {
          const intensity = getActivityIntensity(date);
          const colorClass = getDayColor(intensity);
          const dateString = date.toISOString().split('T')[0];
          const hasActivity = activityData[dateString] > 0;

          return (
            <div
              key={dateString}
              className={`w-3 h-3 cursor-pointer rounded-sm border ${colorClass} transition-all duration-100 ${hasActivity ? 'hover:scale-125 hover:shadow-md' : ''}`}
              onMouseEnter={() => setHoveredDate({ date: dateString, distance: activityData[dateString] || 0 })}
              onMouseLeave={() => setHoveredDate(null)}
            ></div>
          );
        })}
      </div>

      {hoveredDate && (
        <div className="absolute bg-neutral-700 text-white text-xs p-2 rounded shadow-md z-10 -bottom-10">
          {hoveredDate.date}: {hoveredDate.distance} KM
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center items-center gap-2 mt-4 text-xs text-neutral-400">
        Less
        <div className="flex gap-1 mx-2">
          {[0, 1, 2, 3, 4, 5].map(intensity => (
            <div key={intensity} className={`w-3 h-3 rounded-sm border border-neutral-800 ${getDayColor(intensity)}`}></div>
          ))}
        </div>
        More
      </div>
    </div>
  );
};

export default HeatmapCalendar;
