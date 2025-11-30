import React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Activity } from 'lucide-react';

// --- CONFIGURATION ---
const COLORS = {
  bike: "#FF4500", // International Orange (Ironman)
  run: "#00FF41",  // Terminal Green
  swim: "#00BFFF", // Deep Sky Blue
  workout: "#D946EF" // Neon Magenta
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-[#333] p-3 font-mono shadow-[0_0_20px_rgba(0,0,0,0.8)] min-w-[150px]">
        <div className="text-[#666] text-[10px] mb-2 uppercase tracking-widest border-b border-[#222] pb-1">
          WEEK: {label}
        </div>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
              <span className="uppercase tracking-wider flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-1 h-1 bg-current"></span>
                {entry.name}
              </span>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-6 text-[10px] font-mono uppercase tracking-[0.2em] text-[#555]">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
          <div className="w-2 h-2 border border-current" style={{ color: entry.color, backgroundColor: entry.color + '20' }}></div>
          {entry.value}
        </div>
      ))}
    </div>
  );
};

CustomLegend.propTypes = {
  payload: PropTypes.array
};

const ProgressCharts = ({ chartData }) => {
  return (
    <div className="w-full flex flex-col p-6 bg-[#0a0a0a] border border-[#222] rounded-lg shadow-sm font-mono mt-8 relative overflow-hidden">

      {/* Decorative Top Gradient */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF4500] to-transparent opacity-30"></div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-8 border-b border-[#222] pb-4">
        <Activity className="w-4 h-4 text-[#444]" />
        <h3 className="text-sm font-bold text-[#888] uppercase tracking-[0.2em]">
          Volume Analysis <span className="text-[#333]">//</span> Weekly
        </h3>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" vertical={false} />

            <XAxis
              dataKey="week"
              tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#222' }}
              tickLine={false}
              dy={15}
              tickFormatter={(value) => value.substring(5)} // Show MM-DD
            />
            <YAxis
              tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }} />

            <Legend content={<CustomLegend />} />

            {/* Lines */}
            <Line
              type="monotone"
              dataKey="bike"
              stroke={COLORS.bike}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#000', stroke: COLORS.bike, strokeWidth: 2 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="run"
              stroke={COLORS.run}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#000', stroke: COLORS.run, strokeWidth: 2 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="swim"
              stroke={COLORS.swim}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#000', stroke: COLORS.swim, strokeWidth: 2 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="workout"
              stroke={COLORS.workout}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#000', stroke: COLORS.workout, strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

ProgressCharts.propTypes = {
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      week: PropTypes.string.isRequired,
      bike: PropTypes.number,
      run: PropTypes.number,
      swim: PropTypes.number,
      workout: PropTypes.number
    })
  ).isRequired
};

export default ProgressCharts;