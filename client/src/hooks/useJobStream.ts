import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Job, Message } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

export function useJobStream(jobId: string) {
    const [job, setJob] = useState<Job | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isConnectingRef = useRef(false);
    const { getToken } = useAuth();

    useEffect(() => {
        let eventSource: EventSource | null = null;

        const connect = async () => {
            if (isConnectingRef.current) {
                console.log('[useJobStream] Already connecting, skipping...');
                return;
            }
            isConnectingRef.current = true;

            try {
                const token = await getToken();

                const jobResponse = await fetch(`${API_BASE_URL}/job/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (jobResponse.ok) {
                    const data = await jobResponse.json();
                    setJob(data.job);
                    setMessages(data.messages);
                } else {
                    setError('Failed to fetch job');
                    isConnectingRef.current = false;
                    return;
                }

                const { EventSourcePolyfill } = await import('event-source-polyfill');

                eventSource = new EventSourcePolyfill(`${API_BASE_URL}/job/${jobId}/stream`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    heartbeatTimeout: 300000,
                } as object);

                eventSource.onopen = () => {
                    console.log('[useJobStream] SSE connection opened');
                    setIsConnected(true);
                    setError(null);
                };

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.type === 'init') {
                            setJob(data.job);
                            setMessages(data.messages);
                            return;
                        }

                        if (data.jobId && data.messageId) {
                            setMessages(prev => {
                                const existingIndex = prev.findIndex(m => m.messageId === data.messageId);
                                if (existingIndex === -1) {
                                    console.warn('[useJobStream] Message not found for update:', data.messageId, 'Available messages:', prev.map(m => m.messageId));
                                    return prev;
                                }

                                const newMessages = [...prev];
                                const msg = newMessages[existingIndex];

                                if (data.type === 'stream' && data.chunk) {
                                    console.log('[useJobStream] Received chunk:', data.chunk);
                                    console.log('[useJobStream] Current detailed:', msg.data.final?.detailed);

                                    newMessages[existingIndex] = {
                                        ...msg,
                                        data: {
                                            ...msg.data,
                                            final: {
                                                summary: msg.data.final?.summary || '',
                                                detailed: (msg.data.final?.detailed || '') + data.chunk,
                                                citations: msg.data.final?.citations || []
                                            }
                                        }
                                    };

                                    console.log('[useJobStream] New detailed:', newMessages[existingIndex].data.final!.detailed);
                                    console.log('[useJobStream] Returning new messages array, length:', newMessages.length);
                                    return newMessages;
                                }

                                const updatedMsg = { ...msg };
                                if (data.status) updatedMsg.status = data.status;

                                if (data.data) {
                                    if (data.status === 'planning' && data.step === 'complete') {
                                        updatedMsg.data = { ...updatedMsg.data, plan: data.data };
                                    }
                                    if (data.status === 'searching' && data.step === 'complete') {
                                        updatedMsg.data = { ...updatedMsg.data, search: data.data };
                                    }
                                    if (data.status === 'extracting' && data.step === 'complete') {
                                        updatedMsg.data = { ...updatedMsg.data, extraction: data.data };
                                    }
                                    if (data.status === 'compiling' && data.step === 'complete') {
                                        updatedMsg.data = { ...updatedMsg.data, final: data.data };
                                    }
                                    if (data.status === 'done') {
                                        // Merge final data
                                        updatedMsg.data = { ...updatedMsg.data, ...data.data };
                                    }
                                    if (data.error) {
                                        updatedMsg.data = { ...updatedMsg.data, error: data.error };
                                    }
                                }

                                newMessages[existingIndex] = updatedMsg;
                                return newMessages;
                            });
                        }

                    } catch (err) {
                        console.error('Error parsing SSE data:', err);
                    }
                };

                eventSource.onerror = (_err) => {
                    console.log('[useJobStream] SSE error');
                    setIsConnected(false);
                };

            } catch (err) {
                console.error('Failed to initialize EventSource:', err);
                setError('Failed to connect to stream');
                isConnectingRef.current = false;
            }
        };

        if (jobId) {
            connect();
        }

        return () => {
            console.log('[useJobStream] Cleanup: closing SSE connection');
            if (eventSource) {
                eventSource.close();
            }
            setTimeout(() => {
                isConnectingRef.current = false;
            }, 100);
        };
    }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { job, messages, error, isConnected };
}
