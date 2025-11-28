"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useJobStream } from "@/hooks/useJobStream";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import { exportJobToPdf } from "@/utils/pdf-export";
import { useJobThread } from "@/hooks/useJobThread";
import { useFollowUp } from "@/hooks/useFollowUp";
import { JobMessage } from "@/components/research/JobMessage";
import ChatInput from "@/components/research/ChatInput";

export default function JobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const { job: currentJob, error } = useJobStream(jobId);
    const { getToken } = useAuth();
    const { user } = useUser();
    const bottomRef = useRef<HTMLDivElement>(null);
    const { thread, isLoadingThread } = useJobThread(jobId, getToken);
    const { isSubmittingFollowUp, submitFollowUp } = useFollowUp(jobId, getToken);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentJob, thread.length]);

    const handleExportPDF = () => {
        if (currentJob) {
            exportJobToPdf(currentJob);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <div className="text-lg font-medium mb-2">Research Job Failed</div>
                <div className="text-muted-foreground mb-6">{error}</div>
                <Button onClick={() => router.push("/")} variant="outline">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Return Home
                </Button>
            </div>
        );
    }

    if (isLoadingThread) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <div className="text-sm text-muted-foreground">Loading conversation...</div>
                </div>
            </div>
        );
    }

    // Combine historical thread with current live job
    const displayJobs = [...thread];
    if (currentJob && displayJobs.length > 0 && displayJobs[displayJobs.length - 1].jobId === currentJob.jobId) {
        displayJobs[displayJobs.length - 1] = currentJob;
    } else if (currentJob) {
        displayJobs.push(currentJob);
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left - Home Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/")}
                            className="hover:bg-accent"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Home
                        </Button>

                        {/* Right - Export and Dashboard Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportPDF}
                                disabled={!currentJob?.data.final || currentJob.status !== 'done'}
                                className="hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="w-4 h-4 mr-2"
                                    strokeWidth={2}
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Export PDF
                            </Button>
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="font-mono tracking-wider bg-primary/5 border border-primary/10 text-primary/90 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300"
                                >
                                    Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat-like Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
                {displayJobs.map((job, index) => (
                    <JobMessage
                        key={job.jobId}
                        job={job}
                        userImageUrl={user?.imageUrl}
                        isLast={index === displayJobs.length - 1}
                    />
                ))}

                {/* Auto-scroll anchor */}
                <div ref={bottomRef} />
            </main>

            {/* Fixed Chat Input at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/0 pt-8 pb-4">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ChatInput
                        onSubmit={(query, isDeepResearch) => submitFollowUp(currentJob?.jobId || jobId, isDeepResearch, query)}
                        isLoading={isSubmittingFollowUp}
                        disabled={currentJob?.status !== 'done'}
                        placeholder="Ask a follow-up question..."
                        defaultMode={(currentJob?.type === 'chat') ? 'chat' : 'research'}
                    />
                </div>
            </div>
        </div>
    );
}
