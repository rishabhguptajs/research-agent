import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface LatencyState {
  latency: number | null;
  isMeasuring: boolean;
  status: 'online' | 'offline' | 'measuring';
  lastUpdated: Date | null;
}

export function useLatency() {
  const [state, setState] = useState<LatencyState>({
    latency: null,
    isMeasuring: false,
    status: 'measuring',
    lastUpdated: null,
  });

  const measureLatency = useCallback(async () => {
    setState(prev => ({ ...prev, isMeasuring: true }));

    try {
      const startTime = performance.now();
      await api.get('/health');
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setState({
        latency,
        isMeasuring: false,
        status: 'online',
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMeasuring: false,
        status: 'offline',
        lastUpdated: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    measureLatency();
    const interval = setInterval(measureLatency, 60000);
    return () => clearInterval(interval);
  }, [measureLatency]);

  const getLatencyColor = useCallback(() => {
    if (state.status === 'offline') return 'text-red-500';
    if (!state.latency) return 'text-muted-foreground';

    if (state.latency < 50) return 'text-green-500'; 
    if (state.latency < 100) return 'text-yellow-500'; 
    if (state.latency < 200) return 'text-orange-500';
    return 'text-red-500';
  }, [state.latency, state.status]);

  const getStatusColor = useCallback(() => {
    switch (state.status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'measuring': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }, [state.status]);

  const formatLatency = useCallback(() => {
    if (state.status === 'offline') return 'OFFLINE';
    if (!state.latency) return 'MEASURING...';
    return `${state.latency}ms`;
  }, [state.latency, state.status]);

  return {
    ...state,
    getLatencyColor,
    getStatusColor,
    formatLatency,
    measureLatency,
  };
}
