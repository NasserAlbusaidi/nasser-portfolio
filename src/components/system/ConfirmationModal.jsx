import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "CONFIRMATION_REQUIRED",
  message = "Are you sure you want to proceed with this action?"
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#050505] border-2 border-neon-orange p-6 rounded-none shadow-[0_0_30px_rgba(255,95,0,0.2)] max-w-md w-full relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-neon-orange hover:text-white"><X className="w-6 h-6" /></button>
        <h3 className="text-neon-orange font-bold mb-6 flex items-center gap-2 tracking-widest uppercase">
          <AlertTriangle className="w-4 h-4" /> {title}
        </h3>

        <p className="text-neutral-300 text-sm leading-relaxed mb-8 font-mono">
          {message}
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-3 px-6 uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 px-6 uppercase tracking-widest"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
