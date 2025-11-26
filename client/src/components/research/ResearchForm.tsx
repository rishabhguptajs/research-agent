"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useMobile } from "@/hooks/use-mobile";

export default function ResearchForm() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
    const [hasTavilyKey, setHasTavilyKey] = useState(false);
    const [checkingKey, setCheckingKey] = useState(true);
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();

    useEffect(() => {
        const checkApiKey = async () => {
            if (!isSignedIn) {
                setCheckingKey(false);
                return;
            }

            try {
                const token = await getToken();

                // Check both API keys
                const [openRouterResponse, tavilyResponse] = await Promise.all([
                    api.get("/user/key/openrouter", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    api.get("/user/key/tavily", {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);

                setHasOpenRouterKey(openRouterResponse.data.hasKey);
                setHasTavilyKey(tavilyResponse.data.hasKey);
            } catch (error) {
                console.error("Failed to check API keys:", error);
                setHasOpenRouterKey(false);
                setHasTavilyKey(false);
            } finally {
                setCheckingKey(false);
            }
        };

        checkApiKey();
    }, [isSignedIn, getToken]);

    const isMobile = useMobile();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const response = await api.post(
                "/job",
                { query },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const { jobId } = response.data;
            router.push(`/job/${jobId}`);
        } catch (error: any) {
            console.error("Failed to start research:", error);

            // Handle API key not configured error from backend
            if (error.response?.status === 403) {
                alert("Please configure your API key in the dashboard first");
                router.push("/dashboard");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-none blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className={`relative flex items-center bg-background border border-border ${isMobile ? 'p-1' : 'p-2'}`}>
                    <Search className={`text-muted-foreground ${isMobile ? 'w-4 h-4 ml-2 mr-2' : 'w-5 h-5 ml-3 mr-3'}`} />
                    <Input
                        type="text"
                        placeholder={isMobile ? "Research topic..." : "What do you want to research today?"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 ${isMobile ? 'text-base h-10' : 'text-lg h-12'}`}
                        autoFocus
                        disabled={isSignedIn && (!hasOpenRouterKey || !hasTavilyKey) && !checkingKey}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading || !query.trim() || (isSignedIn && (!hasOpenRouterKey || !hasTavilyKey) && !checkingKey)}
                        variant="premium"
                        className={`${isMobile ? 'ml-1 h-9 px-3' : 'ml-2 h-10 px-6'}`}
                    >
                        {isLoading ? (
                            <Sparkles className="w-4 h-4 animate-spin" />
                        ) : (
                            <ArrowRight className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Full-width glassmorphic status banner */}
            {isSignedIn && !checkingKey && (!hasOpenRouterKey || !hasTavilyKey) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl"></div>
                    <div className={`relative border border-amber-500/30 bg-background/40 backdrop-blur-md flex items-center justify-between ${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                            <span className={`font-mono text-amber-500/90 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                API_KEYS_NOT_CONFIGURED
                            </span>
                            {!isMobile && (
                                <span className="text-xs text-muted-foreground">
                                    {!hasOpenRouterKey && !hasTavilyKey
                                        ? "Configure your OpenRouter and Tavily API keys to begin research"
                                        : !hasOpenRouterKey
                                            ? "Configure your OpenRouter API key to continue"
                                            : "Configure your Tavily API key to continue"}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-2"
                        >
                            CONFIGURE →
                        </button>
                    </div>
                </motion.div>
            )}

            <div className={`flex justify-center gap-4 text-xs text-muted-foreground font-mono ${isMobile ? 'flex-col items-center gap-2' : ''}`}>
                <span>Try: "Solid state batteries"</span>
                {!isMobile && <span>•</span>}
                <span>"Generative AI in Healthcare"</span>
                {!isMobile && <span>•</span>}
                <span>"Quantum Computing 2024"</span>
            </div>
        </form>
    );
}
