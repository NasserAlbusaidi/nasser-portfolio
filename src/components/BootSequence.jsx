import React, { useState, useEffect } from 'react';

const BOOT_LINES = [
    "INITIALIZING NASSER_OS KERNEL...",
    "LOADING MEMORY MODULES... OK",
    "MOUNTING FILE SYSTEM... OK",
    "CHECKING INTEGRITY... VERIFIED",
    "ESTABLISHING SECURE CONNECTION...",
    "ACCESSING ARCHIVE DATABASE...",
    "DECRYPTING GARAGE ASSETS...",
    "LOADING MISSION ROADMAP...",
    "SYSTEM READY."
];

export default function BootSequence({ onComplete }) {
    const [lines, setLines] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex >= BOOT_LINES.length) {
            const timeout = setTimeout(() => {
                onComplete();
            }, 800); // Short delay after completion before unmounting
            return () => clearTimeout(timeout);
        }

        const delay = Math.random() * 300 + 100; // Random delay between 100ms and 400ms
        const timeout = setTimeout(() => {
            setLines(prev => [...prev, BOOT_LINES[currentIndex]]);
            setCurrentIndex(prev => prev + 1);
        }, delay);

        return () => clearTimeout(timeout);
    }, [currentIndex, onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-black text-green-500 font-mono p-4 flex flex-col justify-center items-center">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2">NASSER_OS</h1>
                    <div className="text-xs uppercase tracking-[0.3em] opacity-50">System Initialization</div>
                </div>

                <div className="bg-neutral-900/20 border border-green-900/30 p-6 rounded-lg backdrop-blur-sm min-h-[300px] flex flex-col">
                    {lines.map((line, index) => (
                        <div key={index} className="mb-2 text-xs md:text-sm tracking-wider font-bold">
                            <span className="opacity-40 mr-3">[{new Date().toLocaleTimeString()}]</span>
                            {line}
                        </div>
                    ))}
                    <div className="animate-pulse text-green-500 mt-2">_</div>
                </div>
            </div>
        </div>
    );
}
