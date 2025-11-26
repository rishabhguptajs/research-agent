import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { JobStatus } from '@/types';

// Redefining types for client-side to avoid direct backend import issues if not monorepo
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

                // First, fetch the full job data to get createdAt and query
                const jobResponse = await fetch(`http://localhost:3000/job/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (jobResponse.ok) {
                    const fullJob = await jobResponse.json();
                    // Initialize with complete job data
                    setJob({
                        jobId: fullJob.jobId,
                        userId: fullJob.userId,
                        query: fullJob.query,
                        createdAt: fullJob.createdAt,
                        status: fullJob.status,
                        data: fullJob.data || {}
                    });
                }

                // Now connect to SSE for live updates
                const { EventSourcePolyfill } = await import('event-source-polyfill');

                eventSource = new EventSourcePolyfill(`http://localhost:3000/job/${jobId}/stream`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                eventSource.onopen = () => {
                    setIsConnected(true);
                    setError(null);
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

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

                            // Preserve createdAt and query from initial fetch
                            const newState = {
                                ...prev,
                                query: prev.query,
                                createdAt: prev.createdAt
                            };

                            if (data.status) newState.status = data.status;

                            // Merge data if present
                            if (data.data) {
                                if (data.status === 'planning' && data.step === 'complete') newState.data.plan = data.data;
                                if (data.status === 'searching' && data.step === 'complete') newState.data.search = data.data;
                                if (data.status === 'extracting' && data.step === 'complete') newState.data.extraction = data.data;
                                if (data.status === 'compiling' && data.step === 'complete') newState.data.final = data.data;
                                if (data.status === 'done') newState.data = data.data.data || newState.data;
                                if (data.error) newState.data.error = data.error;
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
                    console.error('EventSource error:', err);
                    setError('Connection lost. Retrying...');
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
