import React, { useMemo } from 'react';
import { Menu, X, Terminal, Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function Navigation() {
    const {
        isMenuOpen, setIsMenuOpen,
        isUnlocked, clickCount, incrementClickCount,
        setShowPinPad, resetClickCount,
        wellnessLogs
    } = useStore();

    // --- CALCULATE LAST SYNC TIME ---
    const lastSyncLabel = useMemo(() => {
        if (!wellnessLogs || wellnessLogs.length === 0) return "OFFLINE";

        let maxTs = 0;
        wellnessLogs.forEach(log => {
            if (log.updatedAt) {
                // Handle Firestore Timestamp (seconds) vs Date object vs String
                const ts = log.updatedAt.seconds
                    ? log.updatedAt.seconds * 1000
                    : new Date(log.updatedAt).getTime();
                if (ts > maxTs) maxTs = ts;
            }
        });

        if (maxTs === 0) return "OFFLINE";

        const date = new Date(maxTs);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        return isToday ? `TODAY ${timeStr}` : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} ${timeStr}`;
    }, [wellnessLogs]);

    const handleSecretTrigger = () => {
        if (isUnlocked) return;
        if (clickCount + 1 === 3) {
            setShowPinPad(true);
            resetClickCount();
        } else {
            incrementClickCount();
        }
    };

    const NavLink = ({ href, label, onClick }) => (
        <a
            href={href}
            onClick={onClick}
            className="group relative block w-full py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
        >
            <span className="absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity text-neon-orange">{'>'}</span>
            {label}
            <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-neon-orange">{'<'}</span>
        </a>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/90 border-b border-neutral-800 backdrop-blur-md">
            <div className="max-w-screen-2xl mx-auto px-6 h-16 flex justify-between items-center">

                {/* Logo / Secret Trigger */}
                <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={handleSecretTrigger}>
                    <div className={`w-2 h-2 ${isUnlocked ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-neon-green shadow-[0_0_10px_#00FF41]'} animate-pulse`}></div>
                    <div className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-neutral-400 group-hover:text-white transition-colors">
                        NASSER_OS <span className="text-neutral-600">//</span> v2.0
                    </div>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex gap-8 text-[10px] font-bold tracking-[0.2em] uppercase">
                        <a href="#garage" className="text-neutral-500 hover:text-neon-orange transition-colors">Archive</a>
                        <a href="#roadmap" className="text-neutral-500 hover:text-neon-orange transition-colors">Mission</a>
                        <a href="#analytics" className="text-neutral-500 hover:text-neon-orange transition-colors">Analytics</a>
                    </div>

                    {/* Desktop Sync Indicator */}
                    <div className="hidden lg:flex items-center gap-2 pl-6 border-l border-neutral-800 text-[9px] font-mono text-neutral-600">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span>LAST SYNC: <span className="text-neutral-400">{lastSyncLabel}</span></span>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-neutral-400 hover:text-white transition-colors p-2"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-[#0a0a0a] border-b-2 border-neon-orange shadow-2xl animate-in slide-in-from-top-2 duration-200">
                    {/* Mobile Header with Sync Status */}
                    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/50 border-b border-neutral-800 text-[10px] font-mono">
                        <span className="text-neutral-500">SYSTEM_NAV</span>
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-500 opacity-80">SYNC: {lastSyncLabel}</span>
                            <Terminal className="w-3 h-3 text-neutral-600" />
                        </div>
                    </div>

                    <div className="flex flex-col divide-y divide-neutral-900">
                        <NavLink href="#garage" label="The Archive" onClick={() => setIsMenuOpen(false)} />
                        <NavLink href="#roadmap" label="Mission Log" onClick={() => setIsMenuOpen(false)} />
                        <NavLink href="#analytics" label="Data Analytics" onClick={() => setIsMenuOpen(false)} />
                    </div>
                </div>
            )}
        </nav>
    );
}