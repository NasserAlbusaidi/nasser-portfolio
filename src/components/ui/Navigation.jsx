import React from 'react';
import { Menu, X, Terminal } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function Navigation() {
    const { isMenuOpen, setIsMenuOpen, isUnlocked, clickCount, incrementClickCount, setShowPinPad, resetClickCount } = useStore();

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
                <div className="hidden md:flex gap-8 text-[10px] font-bold tracking-[0.2em] uppercase">
                    <a href="#garage" className="text-neutral-500 hover:text-neon-orange transition-colors">Archive</a>
                    <a href="#roadmap" className="text-neutral-500 hover:text-neon-orange transition-colors">Mission</a>
                    <a href="#analytics" className="text-neutral-500 hover:text-neon-orange transition-colors">Analytics</a>
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
                    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/50 border-b border-neutral-800 text-[10px] text-neutral-500 font-mono">
                        <span>SYSTEM_NAV</span>
                        <Terminal className="w-3 h-3" />
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