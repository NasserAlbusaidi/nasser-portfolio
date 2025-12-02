import React from 'react';
import { formatTime } from '../../utils/time';

const SplitCard = ({ type, time, label, subtext, colorClass }) => {
    return (
        <div className="bg-neutral-900/30 p-3 border border-neutral-800 flex flex-col items-center justify-center">
            <div className={`text-[9px] ${colorClass} uppercase tracking-widest mb-1`}>{type}</div>
            <div className="text-xl font-bold text-white">{formatTime(time)}</div>
            {subtext && <div className="text-[8px] text-neutral-600">{subtext}</div>}
            <div className="text-[8px] text-neutral-600">{label}</div>
        </div>
    );
};

export default SplitCard;
