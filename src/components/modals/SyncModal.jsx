import React, { useState } from 'react';
import { RefreshCw, X, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNotification } from '../../contexts/NotificationContext';
import { fetchActivities, processActivities } from '../../api/intervals';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../App';

export default function SyncModal() {
    const { modals, toggleModal, user, isUnlocked, loading, trainingLogs } = useStore();
    const { addNotification } = useNotification();

    const [syncConfig, setSyncConfig] = useState({
        athleteId: import.meta.env.VITE_INTERVALS_ATHLETE_ID || localStorage.getItem('intervals_athlete_id') || '',
        apiKey: import.meta.env.VITE_INTERVALS_API_KEY || localStorage.getItem('intervals_api_key') || '',
        afterDate: new Date().toISOString().split('T')[0]
    });
    const [isSyncing, setIsSyncing] = useState(false);

    if (!modals.sync) return null;

    const handleSync = async (e) => {
        e.preventDefault();
        if (!user || !isUnlocked) return;
        if (loading) {
            addNotification("Please wait for existing logs to load before syncing.", "info");
            return;
        }
        setIsSyncing(true);
        let addedCount = 0, updatedCount = 0, skippedCount = 0;

        try {
            localStorage.setItem('intervals_athlete_id', syncConfig.athleteId);
            localStorage.setItem('intervals_api_key', syncConfig.apiKey);
            const rawActivities = await fetchActivities(syncConfig.athleteId, syncConfig.apiKey, syncConfig.afterDate);
            const processed = processActivities(rawActivities);
            const existingIds = new Set(trainingLogs.map(l => String(l.externalId)));

            for (const activity of processed) {
                if (existingIds.has(String(activity.externalId))) {
                    const logToUpdate = trainingLogs.find(l => String(l.externalId) === String(activity.externalId));
                    if (logToUpdate && logToUpdate.id) {
                        const docRef = doc(db, 'ironman_logs', logToUpdate.id);
                        await updateDoc(docRef, { ...activity, updatedAt: serverTimestamp() });
                        updatedCount++;
                    } else { skippedCount++; }
                } else {
                    await addDoc(collection(db, 'ironman_logs'), { ...activity, createdAt: serverTimestamp() });
                    addedCount++;
                }
            }
            addNotification(`Sync complete. Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`, "success");
            toggleModal('sync', false);
        } catch (error) {
            console.error(error);
            addNotification(`Sync failed: ${error.message}`, "error");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-lg shadow-2xl max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> SYNC INTERVALS.ICU</h3>
                    <button onClick={() => toggleModal('sync', false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSync} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Athlete ID</label>
                        <input type="text" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500" value={syncConfig.athleteId} onChange={e => setSyncConfig({ ...syncConfig, athleteId: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API Key</label>
                        <input type="password" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500" value={syncConfig.apiKey} onChange={e => setSyncConfig({ ...syncConfig, apiKey: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Sync From Date</label>
                        <input type="date" required className="w-full bg-black border border-neutral-800 p-3 text-xs text-white outline-none focus:border-blue-500" value={syncConfig.afterDate} onChange={e => setSyncConfig({ ...syncConfig, afterDate: e.target.value })} />
                    </div>
                    <button disabled={isSyncing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 tracking-widest flex items-center justify-center gap-2 mt-4">
                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{isSyncing ? "SYNCING..." : "START SYNC"}
                    </button>
                </form>
            </div>
        </div>
    );
}
