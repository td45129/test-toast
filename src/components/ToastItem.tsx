import { useState, useEffect, useCallback, useRef } from 'react';
import type { Toast } from '../types/types';

const ANIMATION_DURATION = 300;
const DEFAULT_DURATION = 3000;

interface ToastItemProps {
  toast: Toast;
  resetKey: number;
  onRemove: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, resetKey, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const remainingRef = useRef(toast.duration ?? DEFAULT_DURATION);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isPausedRef = useRef(false);

  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  const clearAllTimers = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(exitTimerRef.current);
  }, []);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      onRemoveRef.current(toast.id);
    }, ANIMATION_DURATION);
  }, [toast.id]);

  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, remainingRef.current);
  }, [dismiss]);

  const pauseTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }, []);

  const handleMouseEnter = useCallback(() => {
    isPausedRef.current = true;
    pauseTimer();
  }, [pauseTimer]);

  const handleMouseLeave = useCallback(() => {
    isPausedRef.current = false;
    startTimer();
  }, [startTimer]);

  const handleClose = useCallback(() => {
    clearAllTimers();
    dismiss();
  }, [clearAllTimers, dismiss]);

  // Start timer on mount and reset on deduplication
  useEffect(() => {
    remainingRef.current = toast.duration ?? DEFAULT_DURATION;
    setIsExiting(false);
    clearAllTimers();
    if (!isPausedRef.current) {
      startTimer();
    }
    return clearAllTimers;
  }, [resetKey, toast.duration, clearAllTimers, startTimer]);

  return (
    <div
      className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{toast.message}</span>
      <button onClick={handleClose}>&times;</button>
    </div>
  );
};
