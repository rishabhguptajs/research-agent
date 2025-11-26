import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export function useFollowUp(jobId: string, getToken: () => Promise<string | null>) {
    const [followUpQuery, setFollowUpQuery] = useState("");
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
    const router = useRouter();

    const submitFollowUp = async (parentJobId: string, isDeepResearch: boolean) => {
        if (!followUpQuery.trim() || isSubmittingFollowUp) return;

        setIsSubmittingFollowUp(true);
        try {
            const token = await getToken();
            const response = await api.post(
                '/job',
                {
                    query: followUpQuery.trim(),
                    parentJobId: parentJobId || jobId,
                    type: isDeepResearch ? 'research' : 'chat'
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const { jobId: newJobId } = response.data;
            router.push(`/job/${newJobId}`);
        } catch (err) {
            console.error('Follow-up submission error:', err);
            alert('Failed to submit follow-up question. Please try again.');
            setIsSubmittingFollowUp(false);
        }
    };

    return {
        followUpQuery,
        setFollowUpQuery,
        isSubmittingFollowUp,
        submitFollowUp
    };
}
