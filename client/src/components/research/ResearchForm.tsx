"use client";

import { Search, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobile } from "@/hooks/use-mobile";
import { useResearchForm } from "@/hooks/useResearchForm";
import { StatusBanner } from "./StatusBanner";

export default function ResearchForm() {
    const {
        query,
        setQuery,
        isLoading,
        hasOpenRouterKey,
        hasTavilyKey,
        checkingKey,
        submitResearch,
        isSignedIn
    } = useResearchForm();

    const isMobile = useMobile();

    return (
        <form onSubmit={submitResearch} className="w-full max-w-2xl mx-auto space-y-4">
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
                <StatusBanner hasOpenRouterKey={hasOpenRouterKey} hasTavilyKey={hasTavilyKey} />
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
