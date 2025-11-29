import { Search, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobile } from "@/hooks/use-mobile";
import { useModePreference, ResearchMode } from "@/hooks/useModePreference";
import Link from "next/link";

interface ChatInputProps {
    onSubmit: (query: string, isDeepResearch: boolean) => void;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
    defaultMode?: 'chat' | 'research';
    hasOpenRouterKey?: boolean;
    hasTavilyKey?: boolean;
    isSignedIn?: boolean;
    checkingKey?: boolean;
}

export default function ChatInput({
    onSubmit,
    isLoading = false,
    disabled = false,
    placeholder,
    autoFocus = false,
    defaultMode = 'research',
    hasOpenRouterKey = true,
    hasTavilyKey = true,
    isSignedIn = false,
    checkingKey = false
}: ChatInputProps) {
    const isMobile = useMobile();
    const [query, setQuery] = useState('');
    const { mode, setMode, isInitialized } = useModePreference(defaultMode as ResearchMode);
    const isDeepResearch = mode === 'research';

    const showValidationOverlay = isSignedIn && !checkingKey && (!hasOpenRouterKey || !hasTavilyKey);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !disabled && !isLoading && !showValidationOverlay) {
            onSubmit(query.trim(), isDeepResearch);
            setQuery('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full relative">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className={`relative flex flex-col bg-background border border-border rounded-xl shadow-sm overflow-hidden transition-all focus-within:ring-1 focus-within:ring-ring focus-within:border-primary/50 ${isMobile ? 'p-2' : 'p-3'}`}>

                    <Input
                        type="text"
                        placeholder={placeholder || (isMobile ? "Research topic..." : "Ask anything...")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={`border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 px-2 ${isMobile ? 'text-base h-10' : 'text-lg h-12'}`}
                        autoFocus={autoFocus}
                        disabled={disabled || isLoading || showValidationOverlay}
                    />

                    <div className="flex items-center justify-between mt-3 px-1">
                        {/* Left: Mode Toggle (Segmented Control) */}
                        <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50">
                            <button
                                type="button"
                                onClick={() => setMode('chat')}
                                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${!isDeepResearch
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                title="Chat Mode"
                                disabled={disabled || isLoading || showValidationOverlay}
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-border/50 mx-1"></div>
                            <button
                                type="button"
                                onClick={() => setMode('research')}
                                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${isDeepResearch
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                title="Deep Research Mode"
                                disabled={disabled || isLoading || showValidationOverlay}
                            >
                                <Sparkles className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right: Send Button */}
                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim() || disabled || showValidationOverlay}
                            size="icon"
                            className={`rounded-full transition-all duration-300 ${query.trim()
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                } ${isMobile ? 'h-9 w-9' : 'h-10 w-10'}`}
                        >
                            {isLoading ? (
                                <Sparkles className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    {/* Validation Overlay */}
                    {showValidationOverlay && (
                        <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 max-w-[90%] mx-auto">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-amber-500">API Keys Required</span>
                                    <span className="text-xs text-muted-foreground">
                                        Configure {!hasOpenRouterKey && !hasTavilyKey ? 'OpenRouter & Tavily' : !hasOpenRouterKey ? 'OpenRouter' : 'Tavily'} keys to continue.
                                    </span>
                                </div>
                                <Link href="/dashboard" className="ml-2">
                                    <Button size="sm" variant="outline" className="h-7 cursor-pointer text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">
                                        Configure
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
