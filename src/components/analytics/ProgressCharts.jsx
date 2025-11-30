import React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// 1. Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111]/90 backdrop-blur-md border border-[#333] p-3 rounded-md shadow-2xl">
        <p className="text-gray-400 text-[10px] font-mono mb-2 pb-1 border-b border-[#333] tracking-wider">{label}</p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="text-gray-400 capitalize flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}
              </span>
              <span className="text-gray-100 font-bold">{entry.value}</span>
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

// 2. Custom Legend
const CustomLegend = () => (
  <div className="flex justify-center gap-6 mt-6 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
    <div className="flex items-center gap-2 hover:text-orange-400 transition-colors"><span className="text-orange-500">-o-</span> bike</div>
    <div className="flex items-center gap-2 hover:text-emerald-400 transition-colors"><span className="text-emerald-500">-o-</span> run</div>
    <div className="flex items-center gap-2 hover:text-blue-400 transition-colors"><span className="text-blue-500">-o-</span> swim</div>
    <div className="flex items-center gap-2 hover:text-red-400 transition-colors"><span className="text-red-500">-o-</span> workout</div>
  </div>
);

const ProgressCharts = ({ chartData }) => {
  return (
    <div className="flex flex-col items-center p-6 bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl w-full max-w-6xl mx-auto mt-8 font-mono">
      <h3 className="text-lg font-bold text-gray-200 mb-6 w-full text-center">Weekly Volume</h3>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {/* Subtle Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />

            <XAxis
              dataKey="week"
              tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: '#444', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }} />

            <Line
              type="monotone"
              dataKey="bike"
              stroke="#F97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0a0a0a', stroke: '#F97316', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="run"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0a0a0a', stroke: '#10B981', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="swim"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0a0a0a', stroke: '#3B82F6', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="workout"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0a0a0a', stroke: '#EF4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend />
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