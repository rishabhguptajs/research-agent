import api from "@/lib/api";

export const createJob = async (token: string, query: string, parentJobId?: string, type?: string) => {
    const response = await api.post(
        "/job",
        { query, parentJobId, type },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const getJobs = async (token: string) => {
    const response = await api.get('/jobs', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};
