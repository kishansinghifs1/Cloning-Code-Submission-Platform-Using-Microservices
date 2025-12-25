// Custom hook for polling submission status

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollingOptions {
    interval?: number;
    maxAttempts?: number;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    shouldStopPolling?: (data: any) => boolean;
}

export function usePolling<T>(
    pollFunction: () => Promise<T>,
    options: UsePollingOptions = {}
) {
    const {
        interval = 2000, // Poll every 2 seconds
        maxAttempts = 30, // Stop after 30 attempts (1 minute)
        onSuccess,
        onError,
        shouldStopPolling = () => false,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<any>(null);
    const [attempts, setAttempts] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const attemptsRef = useRef(0);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPolling(false);
        attemptsRef.current = 0;
        setAttempts(0);
    }, []);

    const startPolling = useCallback(() => {
        setIsPolling(true);
        setError(null);
        attemptsRef.current = 0;
        setAttempts(0);

        const poll = async () => {
            try {
                attemptsRef.current++;
                setAttempts(attemptsRef.current);

                const result = await pollFunction();
                setData(result);

                // Check if we should stop polling
                if (shouldStopPolling(result)) {
                    stopPolling();
                    if (onSuccess) {
                        onSuccess(result);
                    }
                    return;
                }

                // Stop if max attempts reached
                if (attemptsRef.current >= maxAttempts) {
                    stopPolling();
                    const timeoutError = new Error('Polling timeout: Maximum attempts reached');
                    setError(timeoutError);
                    if (onError) {
                        onError(timeoutError);
                    }
                }
            } catch (err) {
                setError(err);
                stopPolling();
                if (onError) {
                    onError(err);
                }
            }
        };

        // Initial poll
        poll();

        // Set up interval for subsequent polls
        intervalRef.current = setInterval(poll, interval);
    }, [pollFunction, interval, maxAttempts, shouldStopPolling, onSuccess, onError, stopPolling]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        data,
        isPolling,
        error,
        attempts,
        startPolling,
        stopPolling,
    };
}
