import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNotification } from '../../contexts/NotificationContext';

const ACCESS_PIN = import.meta.env.VITE_ACCESS_PIN;

export default function PinPadModal() {
    const { showPinPad, setShowPinPad, setUnlocked } = useStore();
    const { addNotification } = useNotification();
    const [pinInput, setPinInput] = useState("");

    if (!showPinPad) return null;

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (pinInput === ACCESS_PIN) {
            setUnlocked(true);
            setShowPinPad(false);
            setPinInput("");
        } else {
            addNotification("INVALID_ACCESS_CODE", "error");
            setPinInput("");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg max-w-xs w-full text-center">
                <KeyRound className="w-8 h-8 text-orange-600 mx-auto mb-4" />
                <p className="text-xs text-neutral-500 mb-4">SECURE PROTOCOL</p>
                <form onSubmit={handlePinSubmit}>
                    <input autoFocus type="password" className="w-full bg-black border border-neutral-800 text-center text-xl text-white p-3 rounded mb-4 focus:border-orange-600 outline-none" placeholder="CODE" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)} />
                    <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-3 rounded">UNLOCK</button>
                </form>
            </div>
        </div>
    );
}
