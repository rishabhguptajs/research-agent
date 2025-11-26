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
