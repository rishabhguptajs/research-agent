import { useState, useEffect } from "react";
import api from "@/lib/api";
import { JobStatus } from "@/types";

export function useJobThread(jobId: string, getToken: () => Promise<string | null>) {
    const [thread, setThread] = useState<JobStatus[]>([]);
    const [isLoadingThread, setIsLoadingThread] = useState(true);

    useEffect(() => {
        const fetchThread = async () => {
            try {
                const token = await getToken();
                const response = await api.get(`/job/${jobId}/thread`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setThread(response.data);
            } catch (err) {
                console.error('Failed to fetch thread:', err);
            } finally {
                setIsLoadingThread(false);
            }
        };

        if (jobId) {
            fetchThread();
        }
    }, [jobId, getToken]);

    return { thread, isLoadingThread };
}
