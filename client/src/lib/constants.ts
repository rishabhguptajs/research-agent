const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

if (!SERVER_URL) {
    throw new Error('NEXT_PUBLIC_SERVER_URL environment variable is not defined. Please set it in your .env.local file.');
}

export const API_BASE_URL = SERVER_URL;

export const queryKeys = {
    user: {
        apiKeys: ['user', 'api-keys'] as const,
    },
    jobs: {
        all: ['jobs'] as const,
        list: () => [...queryKeys.jobs.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.jobs.all, 'detail', id] as const,
        thread: (id: string) => [...queryKeys.jobs.all, 'thread', id] as const,
    },
} as const;

export const defaultQueryOptions = {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

export const jobQueryOptions = {
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};
