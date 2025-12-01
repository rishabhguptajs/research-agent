"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { createJob, getJob, getJobs, getJobThread } from '@/services/job.service';
import { queryKeys, jobQueryOptions } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export function useCreateJob() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async ({ query, parentJobId, type, depth }: { query: string; parentJobId?: string; type?: string; depth?: 'standard' | 'deep' }) => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return createJob(token, query, parentJobId, type, depth);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs.list() });
            router.push(`/job/${data.jobId}`);
        },
    });
}

export function useJob(jobId: string) {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: queryKeys.jobs.detail(jobId),
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return getJob(token, jobId);
        },
        ...jobQueryOptions,
        enabled: !!jobId,
    });
}

export function useJobs() {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: queryKeys.jobs.list(),
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return getJobs(token);
        },
        ...jobQueryOptions,
    });
}

export function useJobThreadQuery(jobId: string) {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: queryKeys.jobs.thread(jobId),
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return getJobThread(token, jobId);
        },
        ...jobQueryOptions,
        enabled: !!jobId,
    });
}
