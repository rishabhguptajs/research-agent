"use client";

import { useResearchForm } from "@/hooks/useResearchForm";
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

    const handleSubmit = (query: string, isResearchMode: boolean, depth: 'standard' | 'deep') => {
        submitResearch(undefined, isResearchMode ? 'research' : 'chat', query, depth);
    };

    const isDisabled = checkingKey;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <ChatInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={isDisabled}
                autoFocus
                defaultMode="chat"
                hasOpenRouterKey={hasOpenRouterKey}
                hasTavilyKey={hasTavilyKey}
                isSignedIn={isSignedIn}
                checkingKey={checkingKey}
            />

            <div className={`flex justify-center gap-4 text-xs text-muted-foreground font-mono ${isMobile ? 'flex-col items-center gap-2' : ''}`}>
                <span>Try: &quot;Solid state batteries&quot;</span>
                {!isMobile && <span>•</span>}
                <span>&quot;Generative AI in Healthcare&quot;</span>
                {!isMobile && <span>•</span>}
                <span>&quot;Quantum Computing 2024&quot;</span>
            </div>
        </div>
    );
}
