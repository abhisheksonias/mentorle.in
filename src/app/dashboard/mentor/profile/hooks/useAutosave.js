"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for autosaving form data with debouncing
 * @param {Object} options - Hook configuration
 * @param {Function} options.onSave - Async function to save data
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 1500)
 * @param {Object} options.data - Current form data to watch for changes
 * @param {boolean} options.enabled - Whether autosave is enabled (default: true)
 * @returns {Object} - { saveStatus, lastSaved, triggerSave, isSaving }
 */
export function useAutosave({ 
  onSave, 
  debounceMs = 1500, 
  data, 
  enabled = true 
}) {
  // Save status: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs to track state without causing re-renders
  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);
  const previousDataRef = useRef(null);
  const isSavingRef = useRef(false);

  // Check if data has actually changed (deep comparison for objects/arrays)
  const hasDataChanged = useCallback((newData, oldData) => {
    if (!oldData) return false;
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  }, []);

  // The actual save function
  const performSave = useCallback(async (dataToSave) => {
    if (isSavingRef.current) return;
    
    isSavingRef.current = true;
    setSaveStatus('saving');
    setError(null);

    try {
      await onSave(dataToSave);
      setSaveStatus('saved');
      setLastSaved(new Date());
      previousDataRef.current = dataToSave;
      
      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => {
        setSaveStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err) {
      console.error('Autosave error:', err);
      setSaveStatus('error');
      setError(err.message || 'Failed to save');
      
      // Reset to idle after showing error for 3 seconds
      setTimeout(() => {
        setSaveStatus((current) => current === 'error' ? 'idle' : current);
      }, 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  // Manual trigger for immediate save
  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performSave(data);
  }, [data, performSave]);

  // Effect to handle debounced autosave
  useEffect(() => {
    // Skip first render (initial data load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDataRef.current = data;
      return;
    }

    // Skip if autosave is disabled
    if (!enabled) return;

    // Skip if data hasn't actually changed
    if (!hasDataChanged(data, previousDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, hasDataChanged, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    error,
    triggerSave,
    isSaving: saveStatus === 'saving'
  };
}

export default useAutosave;

