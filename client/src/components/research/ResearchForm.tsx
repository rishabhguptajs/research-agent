"use client";

import { useResearchForm } from "@/hooks/useResearchForm";
import { StatusBanner } from "./StatusBanner";
import { useMobile } from "@/hooks/use-mobile";
import ChatInput from "./ChatInput";

export default function ResearchForm() {
    const {
        isLoading,
        hasOpenRouterKey,
        hasTavilyKey,
        checkingKey,
        submitResearch,
        isSignedIn
    } = useResearchForm();

    const isMobile = useMobile();

    const handleSubmit = (query: string, isDeepResearch: boolean) => {
        submitResearch(undefined, isDeepResearch ? 'research' : 'chat', query);
    };

    const isDisabled = isSignedIn && (!hasOpenRouterKey || !hasTavilyKey) && !checkingKey;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <ChatInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={isDisabled}
                autoFocus
                defaultMode="research"
            />

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
        </div>
    );
}
