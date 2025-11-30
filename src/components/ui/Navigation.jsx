import React from 'react';
import { Menu, X } from 'lucide-react';
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

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/95 border-b border-neutral-800 backdrop-blur-sm">
            <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={handleSecretTrigger}>
                    <div className={`w-3 h-3 ${isUnlocked ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-neon-green shadow-[0_0_10px_#00FF41]'} animate-pulse`}></div>
                    <div className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-400 group-hover:text-white transition-colors">NASSER_OS <span className="text-neutral-600">//</span> v2.0</div>
                </div>
                <div className="hidden md:flex gap-8 text-xs font-bold tracking-[0.2em] uppercase">
                    <a href="#garage" className="text-neutral-500 hover:text-neon-orange hover:underline decoration-2 underline-offset-4 transition-all">Archive</a>
                    <a href="#roadmap" className="text-neutral-500 hover:text-neon-orange hover:underline decoration-2 underline-offset-4 transition-all">Mission</a>
                    <a href="#analytics" className="text-neutral-500 hover:text-neon-orange hover:underline decoration-2 underline-offset-4 transition-all">Analytics</a>
                </div>
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}</button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-[#0a0a0a] py-4">
                    <a href="#garage" className="block text-center text-sm uppercase py-2 hover:text-orange-500 transition-colors" onClick={() => setIsMenuOpen(false)}>The Garage</a>
                    <a href="#roadmap" className="block text-center text-sm uppercase py-2 hover:text-orange-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Mission Roadmap</a>
                    <a href="#analytics" className="block text-center text-sm uppercase py-2 hover:text-orange-500 transition-colors" onClick={() => setIsMenuOpen(false)}>Analytics</a>
                </div>
            )}
        </nav>
    );
}
