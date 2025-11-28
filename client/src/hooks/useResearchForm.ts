import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useApiKeys } from "./useApiKeys";
import { useCreateJob } from "./useJobs";

export function useResearchForm() {
    const router = useRouter();
    const { isSignedIn } = useAuth();

    const { data: apiKeys, isLoading: checkingKey } = useApiKeys();
    const createJobMutation = useCreateJob();

    const hasOpenRouterKey = apiKeys?.hasOpenRouterKey ?? false;
    const hasTavilyKey = apiKeys?.hasTavilyKey ?? false;
    const isLoading = createJobMutation.isPending;

    const submitResearch = async (e?: React.FormEvent, type: 'research' | 'chat' = 'research', query?: string) => {
        if (e) e.preventDefault();

        if (!query || !query.trim()) return;

        if (!isSignedIn) {
            router.push("/sign-in");
            return;
        }

        if (!hasOpenRouterKey || !hasTavilyKey) {
            router.push("/dashboard");
            return;
        }

        try {
            await createJobMutation.mutateAsync({
                query: query.trim(),
                type
            });
        } catch (error: any) {
            console.error("Failed to start research:", error);
            if (error.response?.status === 403) {
                alert("Please configure your API key in the dashboard first");
                router.push("/dashboard");
            }
        }
    };

    return {
        isLoading,
        hasOpenRouterKey,
        hasTavilyKey,
        checkingKey,
        submitResearch,
        isSignedIn
    };
}
