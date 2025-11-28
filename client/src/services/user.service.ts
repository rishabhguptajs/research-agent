import api from "@/lib/api";

export const checkApiKeys = async (token: string) => {
    const [openRouterResponse, tavilyResponse] = await Promise.all([
        api.get("/user/key/openrouter", {
            headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/user/key/tavily", {
            headers: { Authorization: `Bearer ${token}` },
        })
    ]);
    return {
        hasOpenRouterKey: openRouterResponse.data.hasKey,
        hasTavilyKey: tavilyResponse.data.hasKey
    };
};

export const saveApiKey = async (token: string, provider: 'openrouter' | 'tavily', apiKey: string) => {
    const response = await api.post(
        `/user/key/${provider}`,
        { apiKey },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};

export const deleteApiKey = async (token: string, provider: 'openrouter' | 'tavily') => {
    const response = await api.delete(`/user/key/${provider}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
