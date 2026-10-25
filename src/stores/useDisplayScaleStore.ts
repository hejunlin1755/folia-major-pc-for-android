import { create } from 'zustand';
import { getStoredString, setStoredString, getStoredBoolean, setStoredBoolean } from './storagePrimitives';
import { normalizeDisplayScale } from '../utils/displayScale';

// One device's interface scale and completion of its first-run sizing step.
const SCALE_KEY = 'android_display_scale_percent';
const SETUP_KEY = 'android_display_scale_setup_complete';
function readScale(): number {
    try { return normalizeDisplayScale(getStoredString(SCALE_KEY, '100')); } catch { return 100; }
}
function readSetup(): boolean {
    try { return getStoredBoolean(SETUP_KEY, false); } catch { return false; }
}
export const useDisplayScaleStore = create<{
    displayScale: number;
    setupComplete: boolean;
    setDisplayScale: (value: number) => void;
    completeSetup: () => void;
}>(set => ({
    displayScale: readScale(),
    setupComplete: readSetup(),
    setDisplayScale: value => {
        const displayScale = normalizeDisplayScale(value);
        try { setStoredString(SCALE_KEY, String(displayScale)); } catch { /* Keep the in-memory preference if storage is unavailable. */ }
        set({ displayScale });
    },
    completeSetup: () => {
        try { setStoredBoolean(SETUP_KEY, true); } catch { /* The current session can still continue. */ }
        set({ setupComplete: true });
    },
}));
