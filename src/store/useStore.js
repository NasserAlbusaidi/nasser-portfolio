import { create } from 'zustand';

export const useStore = create((set) => ({
    // --- AUTH STATE ---
    user: null,
    isUnlocked: false,
    showPinPad: false,
    clickCount: 0,

    // --- DATA STATE ---
    portfolioItems: [],
    trainingLogs: [],
    loading: true,
    isBooting: true,

    // --- UI STATE ---
    isMenuOpen: false,
    filter: "All",

    // --- MODAL STATE ---
    modals: {
        upload: false,
        edit: false,
        editPhoto: false,
        sync: false,
        confirmation: { isOpen: false, title: '', message: '', onConfirm: () => { } },
    },

    // --- SELECTIONS ---
    selectedImage: null,
    selectedLog: null,
    selectedImage: null,
    selectedLog: null,
    editingLog: null,
    editingPhoto: null,

    // --- ACTIONS ---
    setUser: (user) => set({ user }),
    setUnlocked: (isUnlocked) => set({ isUnlocked }),
    setShowPinPad: (show) => set({ showPinPad: show }),
    incrementClickCount: () => set((state) => ({ clickCount: state.clickCount + 1 })),
    resetClickCount: () => set({ clickCount: 0 }),

    setPortfolioItems: (items) => set({ portfolioItems: items }),
    setTrainingLogs: (logs) => set({ trainingLogs: logs }),
    setLoading: (loading) => set({ loading }),
    setIsBooting: (isBooting) => set({ isBooting }),

    setIsMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
    setFilter: (filter) => set({ filter }),

    toggleModal: (modalName, isOpen) => set((state) => ({
        modals: { ...state.modals, [modalName]: isOpen }
    })),

    setConfirmationModal: (config) => set((state) => ({
        modals: { ...state.modals, confirmation: { ...state.modals.confirmation, ...config } }
    })),

    setSelectedImage: (image) => set({ selectedImage: image }),
    setSelectedLog: (log) => set({ selectedLog: log }),
    setSelectedLog: (log) => set({ selectedLog: log }),
    setEditingLog: (log) => set({ editingLog: log }),
    setEditingPhoto: (photo) => set({ editingPhoto: photo }),
}));
