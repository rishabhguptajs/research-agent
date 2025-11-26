"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export default function ResearchForm() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        if (!isSignedIn) {
            router.push("/sign-in");
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
        } catch (error) {
            console.error("Failed to start research:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-none blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-background border border-border p-2">
                    <Search className="w-5 h-5 text-muted-foreground ml-3 mr-3" />
                    <Input
                        type="text"
                        placeholder="What do you want to research today?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-muted-foreground/50 h-12"
                        autoFocus
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        variant="premium"
                        className="ml-2 h-10 px-6"
                    >
                        {isLoading ? (
                            <Sparkles className="w-4 h-4 animate-spin" />
                        ) : (
                            <ArrowRight className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground font-mono">
                <span>Try: "Solid state batteries"</span>
                <span>•</span>
                <span>"Generative AI in Healthcare"</span>
                <span>•</span>
                <span>"Quantum Computing 2024"</span>
            </div>
        </form>
    );
}
