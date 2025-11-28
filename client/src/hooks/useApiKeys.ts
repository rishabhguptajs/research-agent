"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { checkApiKeys, saveApiKey, deleteApiKey } from '@/services/user.service';
import { queryKeys } from '@/lib/constants';

export function useApiKeys() {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: queryKeys.user.apiKeys,
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return checkApiKeys(token);
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSaveApiKey() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ provider, apiKey }: { provider: 'openrouter' | 'tavily'; apiKey: string }) => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return saveApiKey(token, provider, apiKey);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKeys });
        },
    });
}

export function useDeleteApiKey() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (provider: 'openrouter' | 'tavily') => {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            return deleteApiKey(token, provider);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKeys });
        },
    });
}
