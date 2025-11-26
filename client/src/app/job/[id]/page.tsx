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

export default function JobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const { job: currentJob, error } = useJobStream(jobId);
    const { getToken } = useAuth();
    const { user } = useUser();
    const bottomRef = useRef<HTMLDivElement>(null);
    const { thread, isLoadingThread } = useJobThread(jobId, getToken);
    const { followUpQuery, setFollowUpQuery, isSubmittingFollowUp, submitFollowUp } = useFollowUp(jobId, getToken);

    const [isDeepResearch, setIsDeepResearch] = useState(true);

    // Scroll to bottom when new content arrives
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
                                <Button variant="ghost" size="sm" className="hover:bg-accent">
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
                    <div className="bg-secondary/30 backdrop-blur-sm border border-border rounded-2xl p-1 shadow-xl">
                        <div className="flex items-end gap-2 p-3">
                            <div className="flex-1 min-h-[44px] max-h-32 relative">
                                <textarea
                                    placeholder="Ask a follow-up question..."
                                    className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none py-2 px-1 text-base"
                                    rows={1}
                                    value={followUpQuery}
                                    onChange={(e) => setFollowUpQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            submitFollowUp(currentJob?.jobId || jobId, isDeepResearch);
                                        }
                                    }}
                                    disabled={isSubmittingFollowUp}
                                    style={{ height: '44px' }}
                                />
                            </div>
                            <Button
                                size="icon"
                                className="rounded-xl h-11 w-11 flex-shrink-0 bg-primary hover:bg-primary/90"
                                disabled={!followUpQuery.trim() || isSubmittingFollowUp}
                                onClick={() => submitFollowUp(currentJob?.jobId || jobId, isDeepResearch)}
                            >
                                {isSubmittingFollowUp ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                )}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between px-4 pb-3 pt-1">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsDeepResearch(!isDeepResearch)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${isDeepResearch
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                        <path d="M2 12h10" />
                                        <path d="M9 4v16" />
                                        <path d="M3 9l3 3-3 3" />
                                        <path d="M14 9l3 3-3 3" />
                                        <path d="M22 12h-6" />
                                    </svg>
                                    Deep Research
                                </button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {currentJob?.status === 'done'
                                    ? `Press Enter to submit`
                                    : `Research in progress`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
