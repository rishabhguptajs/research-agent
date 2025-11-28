import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMobile } from "@/hooks/use-mobile";

interface StatusBannerProps {
    hasOpenRouterKey: boolean;
    hasTavilyKey: boolean;
}

export function StatusBanner({ hasOpenRouterKey, hasTavilyKey }: StatusBannerProps) {
    const router = useRouter();
    const isMobile = useMobile();

    return (
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
    );
}
