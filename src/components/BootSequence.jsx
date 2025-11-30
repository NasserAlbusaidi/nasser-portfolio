import React, { useState, useEffect, useRef, useMemo } from 'react';

export default function BootSequence({ onComplete }) {
    const [lines, setLines] = useState([]);
    const [currentText, setCurrentText] = useState("");
    const [stepIndex, setStepIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const bottomRef = useRef(null);

    // Dynamic Boot Steps (Memoized to capture start time)
    const bootSteps = useMemo(() => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

        return [
            { text: `BIOS DATE ${dateStr} ${timeStr} VER 2.4.0`, delay: 200 },
            { text: "CPU: NEURAL ENGINE X-99 // 12 CORES ACTIVE", delay: 100 },
            { text: "MEMORY TEST: 64GB OK", delay: 100 },
            { text: " ", delay: 100 },
            { text: "> MOUNT /DEV/MISSION_LOGS [ROOT]", typing: true, delay: 500 },
            { text: "[ OK ] FILESYSTEM MOUNTED (READ-ONLY)", delay: 100 },
            { text: "[ OK ] LOADED KERNEL MODULES", delay: 50 },
            { text: "[ OK ] IRONMAN_PROTOCOL.SYS INITIALIZED", delay: 300, className: "text-orange-500" },
            { text: "ESTABLISHING SECURE CONNECTION...", delay: 400 },
            { text: "........................................", typing: true, speed: 5, delay: 0 },
            { text: "ACCESS GRANTED.", delay: 200, className: "text-neon-green" },
            { text: " ", delay: 100 },
            { text: "> EXEC_VISUAL_MANIFESTO", typing: true, delay: 600 },
            { text: "cYcLe: 1 // RENDERING GRAPHICS...", delay: 300 },
            { text: "SYSTEM READY.", delay: 800, className: "text-white font-bold animate-pulse" }
        ];
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [lines, currentText]);

    // Sequence Logic
    useEffect(() => {
        if (stepIndex >= bootSteps.length) {
            const exitTimer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(onComplete, 800);
            }, 1000);
            return () => clearTimeout(exitTimer);
        }

        const step = bootSteps[stepIndex];

        if (step.typing) {
            let charIndex = 0;
            const typeInterval = setInterval(() => {
                if (charIndex <= step.text.length) {
                    setCurrentText(step.text.slice(0, charIndex));
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                    setLines(prev => [...prev, { ...step }]);
                    setCurrentText("");
                    setTimeout(() => setStepIndex(prev => prev + 1), step.delay);
                }
            }, step.speed || 30);

            return () => clearInterval(typeInterval);
        } else {
            const timer = setTimeout(() => {
                setLines(prev => [...prev, { ...step }]);
                setStepIndex(prev => prev + 1);
            }, step.delay);
            return () => clearTimeout(timer);
        }
    }, [stepIndex, onComplete, bootSteps]);

    // CRT "Turn Off" Animation
    const exitStyle = isExiting ? {
        animation: 'crt-turn-off 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        pointerEvents: 'none'
    } : {};

    return (
        <div
            className="fixed inset-0 z-[100] bg-black flex flex-col justify-end md:justify-center items-center p-6 md:p-12 overflow-hidden font-mono text-xs md:text-sm leading-relaxed"
            style={exitStyle}
        >
            <style>{`
                @keyframes crt-turn-off {
                    0% { transform: scale(1, 1); opacity: 1; filter: brightness(1); }
                    40% { transform: scale(1, 0.002); opacity: 1; filter: brightness(2); }
                    80% { transform: scale(0, 0.002); opacity: 0; }
                    100% { transform: scale(0, 0); opacity: 0; }
                }
            `}</style>

            {/* Container updated for better full-screen feel while keeping terminal width reasonable */}
            <div className="w-full max-w-3xl h-full md:h-auto flex flex-col justify-end md:justify-start">
                {lines.map((line, i) => (
                    <div key={i} className={`${line.className || 'text-neutral-400'} break-words mb-1`}>
                        <span className="mr-4 opacity-30 select-none hidden md:inline-block">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        {line.text}
                    </div>
                ))}

                {/* Typing Line */}
                {currentText && (
                    <div className="text-white mb-1">
                        <span className="mr-4 opacity-30 select-none hidden md:inline-block">
                            {String(lines.length + 1).padStart(2, '0')}
                        </span>
                        {currentText}
                        <span className="inline-block w-2 h-4 ml-1 bg-neon-green align-middle animate-blink"></span>
                    </div>
                )}

                {/* Idle Cursor */}
                {!currentText && !isExiting && (
                    <div className="mt-1">
                        <span className="inline-block w-2 h-4 bg-neon-green animate-blink shadow-[0_0_8px_rgba(0,255,65,0.8)]"></span>
                    </div>
                )}

                <div ref={bottomRef}></div>
            </div>

            {/* Decorative Mobile Footer */}
            <div className="md:hidden absolute bottom-4 left-0 right-0 text-center opacity-30 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                // System Initialization...
            </div>
        </div>
    );
}