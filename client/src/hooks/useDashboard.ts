import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { JobStatus } from "@/types";
import { getJobs, deleteJob } from "@/services/job.service";

export function useDashboard() {
    const [jobs, setJobs] = useState<JobStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const router = useRouter();
    const { getToken, isSignedIn, isLoaded } = useAuth();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/");
            return;
        }

        const fetchJobs = async () => {
            if (!isSignedIn) return;

            try {
                const token = await getToken();
                if (!token) return;
                const data = await getJobs(token);
                setJobs(data || []);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [getToken, isSignedIn, isLoaded, router]);

    const handleDeleteJob = async (jobId: string) => {
        try {
            const token = await getToken();
            if (!token) return;
            await deleteJob(token, jobId);
            setJobs(prev => prev.filter(job => job.jobId !== jobId));
        } catch (error) {
            console.error("Failed to delete job:", error);
            throw error;
        }
    };

    return {
        jobs,
        isLoading,
        isSettingsOpen,
        setIsSettingsOpen,
        isSignedIn,
        isLoaded,
        handleDeleteJob
    };
}
