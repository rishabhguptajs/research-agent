import { useCreateJob } from './useJobs';

export function useFollowUp() {
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
        } catch (error: unknown) {
            console.error('Failed to submit follow-up:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const err = error as { response: { status: number } };
                if (err.response?.status === 403) {
                    alert('Please configure your API keys in the dashboard first');
                }
            }
        }
    };

    return {
        isSubmittingFollowUp: createJobMutation.isPending,
        submitFollowUp,
    };
}
