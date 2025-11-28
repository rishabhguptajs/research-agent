import { useCreateJob } from './useJobs';

export function useFollowUp(jobId: string, getToken: () => Promise<string | null>) {
    const createJobMutation = useCreateJob();

    const submitFollowUp = async (parentJobId: string, isDeepResearch: boolean, query: string) => {
        if (!query.trim()) return;

        try {
            const type = isDeepResearch ? 'research' : 'chat';
            await createJobMutation.mutateAsync({
                query: query.trim(),
                parentJobId,
                type
            });
        } catch (error: any) {
            console.error('Failed to submit follow-up:', error);
            if (error.response?.status === 403) {
                alert('Please configure your API keys in the dashboard first');
            }
        }
    };

    return {
        isSubmittingFollowUp: createJobMutation.isPending,
        submitFollowUp,
    };
}
