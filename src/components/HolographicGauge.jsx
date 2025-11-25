import React, { useEffect, useState } from 'react';

const HolographicGauge = ({ value, max, label, color = '#00FF41', unit = '' }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    // Animation loop
    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                current = value;
                clearInterval(timer);
            }
            setAnimatedValue(current);
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    // SVG Config
    const radius = 40;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (animatedValue / max) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center p-4 group">
            {/* Holographic Container Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative w-32 h-32">
                {/* Rotating Outer Ring */}
                <div className="absolute inset-0 border border-dashed border-neutral-800 rounded-full animate-[spin_10s_linear_infinite] opacity-30"></div>

                {/* Inner Static Ring */}
                <div className="absolute inset-2 border border-neutral-900 rounded-full"></div>

                <svg
                    height="100%"
                    width="100%"
                    className="transform -rotate-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                >
                    {/* Background Circle */}
                    <circle
                        stroke="#111"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                    />
                    {/* Progress Circle */}
                    <circle
                        stroke={color}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                        className="filter drop-shadow-[0_0_4px_currentColor]"
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-mono text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                        {Math.round(animatedValue)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                        {unit}
                    </span>
                </div>
            </div>

            {/* Label */}
            <div className="mt-2 text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 group-hover:text-white transition-colors">
                {label}
            </div>

            {/* Decorative Glitch Elements */}
            <div className="absolute top-0 left-1/2 w-px h-4 bg-neutral-800"></div>
            <div className="absolute bottom-0 left-1/2 w-px h-4 bg-neutral-800"></div>
        </div>
    );
};

export default HolographicGauge;
