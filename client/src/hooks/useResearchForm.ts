import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { checkApiKeys } from "@/services/user.service";
import { createJob } from "@/services/job.service";

export function useResearchForm() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
    const [hasTavilyKey, setHasTavilyKey] = useState(false);
    const [checkingKey, setCheckingKey] = useState(true);
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();

    useEffect(() => {
        const verifyKeys = async () => {
            if (!isSignedIn) {
                setCheckingKey(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) return;
                const keys = await checkApiKeys(token);
                setHasOpenRouterKey(keys.hasOpenRouterKey);
                setHasTavilyKey(keys.hasTavilyKey);
            } catch (error) {
                console.error("Failed to check API keys:", error);
                setHasOpenRouterKey(false);
                setHasTavilyKey(false);
            } finally {
                setCheckingKey(false);
            }
        };

        verifyKeys();
    }, [isSignedIn, getToken]);

    const submitResearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!query.trim()) return;

        if (!isSignedIn) {
            router.push("/sign-in");
            return;
        }

        if (!hasOpenRouterKey || !hasTavilyKey) {
            router.push("/dashboard");
            return;
        }

        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("No token found");

            const data = await createJob(token, query);
            router.push(`/job/${data.jobId}`);
        } catch (error: any) {
            console.error("Failed to start research:", error);
            if (error.response?.status === 403) {
                alert("Please configure your API key in the dashboard first");
                router.push("/dashboard");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        query,
        setQuery,
        isLoading,
        hasOpenRouterKey,
        hasTavilyKey,
        checkingKey,
        submitResearch,
        isSignedIn
    };
}
