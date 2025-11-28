import { useJobThreadQuery } from './useJobs';

export function useJobThread(jobId: string, getToken: () => Promise<string | null>) {
    const { data: thread = [], isLoading: isLoadingThread } = useJobThreadQuery(jobId);

    return { thread, isLoadingThread };
}
