import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Terminal, MapPin, Calendar, Activity } from 'lucide-react';

const MissionOverview = ({ activityData = {}, year = new Date().getFullYear() }) => {

  // --- CONFIGURATION ---
  const START_MONTH_INDEX = 10; // November (0-indexed)
  const START_DAY = 20;

  // IRONMAN BRANDING ORANGE
  const ACCENT_COLOR = "#FF4500";
  // ---------------------

  const { chartData, missionDistance, activeDays, daysSinceStart, lastActiveDate } = useMemo(() => {
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const relevantMonthsStr = allMonths.slice(START_MONTH_INDEX);
    const chartMap = new Map(relevantMonthsStr.map(m => [m, 0]));

    let totalDist = 0;
    let activeDayCount = 0;
    let lastActivity = new Date(year, START_MONTH_INDEX, START_DAY); // Default to start

    // Define the "Mission Start" timestamp
    const missionStartDate = new Date(year, START_MONTH_INDEX, START_DAY, 0, 0, 0);

    Object.entries(activityData).forEach(([dateStr, value]) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dataDate = new Date(y, m - 1, d, 12, 0, 0);

      // STRICT FILTER: Only count data ON or AFTER Nov 23rd
      if (dataDate >= missionStartDate && dataDate.getFullYear() === year) {

        totalDist += value;
        if (value > 0) {
          activeDayCount++;
          // Track the latest date found in the data for accurate "Consistency" math
          if (dataDate > lastActivity) lastActivity = dataDate;
        }

        // Add to chart
        const monthName = allMonths[dataDate.getMonth()];
        if (chartMap.has(monthName)) {
          chartMap.set(monthName, chartMap.get(monthName) + value);
        }
      }
    });

    // Consistency Math: Calculate days between Start Date and Last Logged Activity
    // This prevents "0%" consistency if you are viewing 2025 data in 2024
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.ceil((lastActivity - missionStartDate) / msPerDay) + 1; // +1 to include start day

    const data = Array.from(chartMap, ([name, value]) => ({ name, value }));

    return {
      chartData: data,
      missionDistance: totalDist,
      activeDays: activeDayCount,
      daysSinceStart: daysPassed, // Using data-driven duration, not system clock
      lastActiveDate: lastActivity.toISOString().split('T')[0]
    };
  }, [activityData, year]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#000] border border-[#333] p-3 font-mono shadow-2xl">
          <div className="text-[#666] text-[10px] mb-1 uppercase tracking-widest border-b border-[#222] pb-1">
            LOG: {label}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-white">
              {payload[0].value.toFixed(1)}
            </span>
            <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>KM</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate consistency percentage
  const consistency = daysSinceStart > 0 ? Math.min(100, Math.round((activeDays / daysSinceStart) * 100)) : 0;

  return (
    <div className="w-full flex flex-col p-6 bg-[#0a0a0a] border border-[#222] rounded-lg shadow-sm font-mono mt-8 relative overflow-hidden">

      {/* Decorative Top Line matching your timeline aesthetics */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#333] to-transparent opacity-50"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-[#222] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-[#444]" />
            <h3 className="text-xs font-bold text-[#555] uppercase tracking-[0.2em]">
              Mission Log: {year}
            </h3>
          </div>
          <h2 className="text-white text-sm md:text-base tracking-widest uppercase">
            Start Sequence: <span style={{ color: ACCENT_COLOR }}>20/11/{year}</span>
          </h2>
        </div>

        <div className="flex gap-8 text-[10px] md:text-xs text-[#444] font-bold">
          <div className="flex flex-col items-end">
            <span className="uppercase tracking-widest mb-1">Status</span>
            <span className="text-emerald-500 animate-pulse">● ONLINE</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="uppercase tracking-widest mb-1">Latest Entry</span>
            <span className="text-[#888]">{lastActiveDate}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        {/* Stat 1: Mission Distance */}
        <div className="p-5 bg-[#080808] border border-[#1a1a1a] flex flex-col justify-between group hover:border-[#333] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#111] to-transparent -mr-8 -mt-8 rotate-45"></div>
          <div className="flex items-center gap-2 mb-4 text-[#555] text-[10px] uppercase tracking-[0.15em]">
            <MapPin className="w-3 h-3" /> Mission Dist
          </div>
          <div className="text-3xl text-white font-bold tracking-tighter">
            {missionDistance.toFixed(0)} <span className="text-sm text-[#444] font-normal">KM</span>
          </div>
          <div className="w-full bg-[#111] h-[2px] mt-4">
            <div className="h-full shadow-[0_0_10px_rgba(255,69,0,0.4)]" style={{ width: '100%', backgroundColor: ACCENT_COLOR }}></div>
          </div>
        </div>

        {/* Stat 2: Active Cycles */}
        <div className="p-5 bg-[#080808] border border-[#1a1a1a] flex flex-col justify-between group hover:border-[#333] transition-colors">
          <div className="flex items-center gap-2 mb-4 text-[#555] text-[10px] uppercase tracking-[0.15em]">
            <Calendar className="w-3 h-3" /> Active Cycles
          </div>
          <div className="text-3xl text-white font-bold tracking-tighter">
            {activeDays} <span className="text-sm text-[#444] font-normal">DAYS</span>
          </div>
          <div className="w-full bg-[#111] h-[2px] mt-4">
            {/* Visualizing Active Days vs Elapsed Time */}
            <div className="bg-[#444] h-full" style={{ width: `${consistency}%` }}></div>
          </div>
        </div>

        {/* Stat 3: Consistency */}
        <div className="p-5 bg-[#080808] border border-[#1a1a1a] flex flex-col justify-between group hover:border-[#333] transition-colors">
          <div className="flex items-center gap-2 mb-4 text-[#555] text-[10px] uppercase tracking-[0.15em]">
            <Activity className="w-3 h-3" /> Consistency
          </div>
          <div className="text-3xl text-white font-bold tracking-tighter">
            {consistency}<span className="text-sm text-[#444] font-normal">%</span>
          </div>
          <div className="w-full bg-[#111] h-[2px] mt-4">
            <div className={`h-full ${consistency > 80 ? 'bg-emerald-500' : 'bg-yellow-600'}`} style={{ width: `${consistency}%` }}></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[250px] w-full bg-[#050505] border border-[#1a1a1a] p-4 relative">
        <div className="absolute top-3 left-4 text-[9px] text-[#333] uppercase tracking-[0.2em]">Volume_Analysis // V2.4</div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 25, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
              axisLine={{ stroke: '#222' }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: '#333', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff', opacity: 0.02 }} />
            <Bar
              dataKey="value"
              fill={ACCENT_COLOR}
              barSize={50}
              radius={[0, 0, 0, 0]} // Sharp corners for brutalist feel
              className="opacity-90 hover:opacity-100 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

MissionOverview.propTypes = {
  activityData: PropTypes.object.isRequired,
  year: PropTypes.number
};

export default MissionOverview;