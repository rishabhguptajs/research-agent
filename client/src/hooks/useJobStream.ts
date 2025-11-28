import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { JobStatus } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

export interface JobData {
    plan?: {
        sub_questions: string[];
        search_queries: string[];
        extraction_fields: string[];
    };
    search?: {
        collectionName: string;
        chunks: any[];
    };
    extraction?: {
        facts: any[];
    };
    final?: {
        summary: string;
        detailed: string;
        citations: any[];
    };
    error?: string;
}

export type JobState = JobStatus;

export function useJobStream(jobId: string) {
    const [job, setJob] = useState<JobState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { getToken } = useAuth();

    useEffect(() => {
        let eventSource: EventSource | null = null;

        const connect = async () => {
            try {
                const token = await getToken();

                const jobResponse = await fetch(`${API_BASE_URL}/job/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (jobResponse.ok) {
                    const fullJob = await jobResponse.json();
                    setJob({
                        jobId: fullJob.jobId,
                        userId: fullJob.userId,
                        query: fullJob.query,
                        createdAt: fullJob.createdAt,
                        status: fullJob.status,
                        data: fullJob.data || {}
                    });
                }

                const { EventSourcePolyfill } = await import('event-source-polyfill');

                eventSource = new EventSourcePolyfill(`${API_BASE_URL}/job/${jobId}/stream`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    heartbeatTimeout: 300000,
                } as any);

                eventSource.onopen = () => {
                    setIsConnected(true);
                    setError(null);
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.type === 'stream' && data.chunk) {
                            setJob(prev => {
                                if (!prev) return prev;
                                return {
                                    ...prev,
                                    data: {
                                        ...prev.data,
                                        final: {
                                            summary: prev.data.final?.summary || '',
                                            detailed: (prev.data.final?.detailed || '') + data.chunk,
                                            citations: prev.data.final?.citations || []
                                        }
                                    }
                                };
                            });
                            return;
                        }

                        setJob(prev => {
                            if (!prev) {
                                return {
                                    jobId,
                                    userId: '',
                                    query: '',
                                    createdAt: Date.now(),
                                    status: data.status,
                                    data: data.data || {}
                                };
                            }

                            const newState = {
                                ...prev,
                                query: prev.query,
                                ...prev.createdAt && { createdAt: prev.createdAt }
                            };

                            if (data.status) newState.status = data.status;

                            if (data.data) {
                                if (data.status === 'planning' && data.step === 'complete') {
                                    newState.data = { ...newState.data, plan: data.data };
                                }
                                if (data.status === 'searching' && data.step === 'complete') {
                                    newState.data = { ...newState.data, search: data.data };
                                }
                                if (data.status === 'extracting' && data.step === 'complete') {
                                    newState.data = { ...newState.data, extraction: data.data };
                                }
                                if (data.status === 'compiling' && data.step === 'complete') {
                                    newState.data = { ...newState.data, final: data.data };
                                }
                                if (data.status === 'done') {
                                    newState.data = data.data;
                                }
                                if (data.error) {
                                    newState.data = { ...newState.data, error: data.error };
                                }
                            }

                            return newState;
                        });

                        if (data.status === 'done' || data.status === 'error') {
                            eventSource?.close();
                            setIsConnected(false);
                        }
                    } catch (err) {
                        console.error('Error parsing SSE data:', err);
                    }
                };

                eventSource.onerror = (err) => {
                    setIsConnected(false);
                };

            } catch (err) {
                console.error('Failed to initialize EventSource:', err);
                setError('Failed to connect to stream');
            }
        };

        if (jobId) {
            connect();
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [jobId, getToken]);

    return { job, error, isConnected };
}
