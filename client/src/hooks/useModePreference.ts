"use client";

import { useState, useEffect } from 'react';

export type ResearchMode = 'chat' | 'research';

const STORAGE_KEY = 'research-mode-preference';

export function useModePreference(defaultMode: ResearchMode = 'chat') {
    const [mode, setModeState] = useState<ResearchMode>(defaultMode);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as ResearchMode | null;
            if (stored === 'chat' || stored === 'research') {
                setModeState(stored);
            }
        } catch (error) {
            console.warn('Failed to read mode preference from localStorage:', error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'chat' || e.newValue === 'research')) {
                setModeState(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const setMode = (newMode: ResearchMode) => {
        try {
            localStorage.setItem(STORAGE_KEY, newMode);
            setModeState(newMode);
        } catch (error) {
            console.warn('Failed to save mode preference to localStorage:', error);
            setModeState(newMode);
        }
    };

    return {
        mode,
        setMode,
        isInitialized,
        isDeepResearch: mode === 'research',
    };
}
