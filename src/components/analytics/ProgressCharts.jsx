import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProgressCharts = ({ chartData }) => {
  return (
    <div className="flex flex-col items-center p-4 bg-[#0a0a0a] border border-neutral-800 rounded-lg shadow-lg w-full max-w-4xl mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Weekly Volume</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="week" tick={{ fill: '#888' }} />
          <YAxis tick={{ fill: '#888' }} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#eee' }} />
          <Legend wrapperStyle={{ color: '#eee', marginTop: '10px' }} />
          <Line type="monotone" dataKey="swim" stroke="#3B82F6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="bike" stroke="#F97316" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="run" stroke="#22C55E" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="workout" stroke="#EF4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressCharts;
