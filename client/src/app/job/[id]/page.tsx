"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useJobStream } from "@/hooks/useJobStream";
import ReportView from "@/components/research/ReportView";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import jsPDF from 'jspdf';
import api from "@/lib/api";

export default function JobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const { job, error, isConnected } = useJobStream(jobId);
    const { getToken } = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [followUpQuery, setFollowUpQuery] = useState("");
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [job]);

    const handleFollowUpSubmit = async () => {
        if (!followUpQuery.trim() || isSubmittingFollowUp) return;

        setIsSubmittingFollowUp(true);
        try {
            const token = await getToken();
            const response = await api.post(
                '/job',
                { query: followUpQuery.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const { jobId: newJobId } = response.data;
            router.push(`/job/${newJobId}`);
        } catch (err) {
            console.error('Follow-up submission error:', err);
            alert('Failed to submit follow-up question. Please try again.');
        } finally {
            setIsSubmittingFollowUp(false);
        }
    };

    const handleExportPDF = () => {
        if (!job || !job.data.final) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        let yPosition = margin;

        pdf.setFillColor(37, 99, 235);
        pdf.rect(0, 0, pageWidth, 40, 'F');

        pdf.setFontSize(22);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Research Report', margin, 25);

        pdf.setFontSize(10);
        pdf.setTextColor(219, 234, 254);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 32);

        yPosition = 55;

        pdf.setFontSize(12);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Research Query:', margin, yPosition);

        pdf.setFontSize(12);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'normal');
        const queryLines = pdf.splitTextToSize(job.query, contentWidth - 40);
        pdf.text(queryLines, margin + 40, yPosition);
        yPosition += (queryLines.length * 7) + 15;

        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(239, 246, 255);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const summaryText = job.data.final.summary.replace(/\[\d+\]/g, '');
        const summaryLines = pdf.splitTextToSize(summaryText, contentWidth - 10);
        const summaryHeight = (summaryLines.length * 6) + 25;

        pdf.roundedRect(margin, yPosition, contentWidth, summaryHeight, 2, 2, 'FD');

        pdf.setFontSize(12);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Executive Summary', margin + 5, yPosition + 10);

        pdf.setFontSize(11);
        pdf.setTextColor(51, 65, 85);
        pdf.setFont('helvetica', 'normal');
        pdf.text(summaryLines, margin + 5, yPosition + 20);

        yPosition += summaryHeight + 20;

        pdf.setFontSize(16);
        pdf.setTextColor(30, 58, 138);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detailed Analysis', margin, yPosition);
        yPosition += 10;

        const detailedText = job.data.final.detailed
            .replace(/#{1,3}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\[\d+\]/g, '');

        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont('helvetica', 'normal');

        const lines = pdf.splitTextToSize(detailedText, contentWidth);
        const lineHeight = 7;

        for (let i = 0; i < lines.length; i++) {
            if (yPosition + lineHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin + 10; // Extra margin on new pages
            }
            pdf.text(lines[i], margin, yPosition);
            yPosition += lineHeight;
        }

        // --- Sources Section ---
        pdf.addPage();
        yPosition = margin + 10;

        pdf.setFontSize(16);
        pdf.setTextColor(30, 58, 138); // Blue-900
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sources & References', margin, yPosition);
        yPosition += 15;

        job.data.final.citations.forEach((citation, idx) => {
            if (yPosition + 25 > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin + 10;
            }

            // Citation Number Badge
            pdf.setFillColor(219, 234, 254); // Blue-100
            pdf.circle(margin + 4, yPosition - 1, 4, 'F');

            pdf.setFontSize(9);
            pdf.setTextColor(30, 58, 138); // Blue-900
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${idx + 1}`, margin + 2.5, yPosition);

            // URL
            pdf.setFontSize(10);
            pdf.setTextColor(37, 99, 235); // Blue-600
            pdf.setFont('helvetica', 'normal');
            const urlLines = pdf.splitTextToSize(citation.source, contentWidth - 20);
            pdf.text(urlLines, margin + 15, yPosition);
            yPosition += (urlLines.length * 5) + 2;

            // Snippet
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139); // Slate-500
            pdf.setFont('helvetica', 'italic');
            const snippetLines = pdf.splitTextToSize(`"${citation.snippet}"`, contentWidth - 20);
            pdf.text(snippetLines, margin + 15, yPosition);
            yPosition += (snippetLines.length * 5) + 10; // Extra spacing between citations
        });

        // --- Footer ---
        const totalPages = pdf.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Footer Line
            pdf.setDrawColor(226, 232, 240); // Slate-200
            pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184); // Slate-400
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
            pdf.text('Research Agent', pageWidth - margin, pageHeight - 8, { align: 'right' });
        }

        // Save
        const fileName = `research-${job.query.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
        pdf.save(fileName);
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

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <div className="text-sm text-muted-foreground">Connecting to research stream...</div>
                </div>
            </div>
        );
    }

    const getStatusIcon = () => {
        if (job.status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (job.status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    };

    const getStatusText = () => {
        switch (job.status) {
            case 'planning': return 'Analyzing your question and planning research strategy...';
            case 'searching': return `Searching the web with ${job.data.plan?.search_queries?.length || 0} optimized queries...`;
            case 'extracting': return `Extracting insights from ${job.data.search?.chunks?.length || 0} sources...`;
            case 'compiling': return 'Compiling comprehensive research report...';
            case 'done': return 'Research complete';
            case 'error': return 'An error occurred during research';
            default: return 'Processing...';
        }
    };

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
                                disabled={!job.data.final || job.status !== 'done'}
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
                {/* User Query - like a chat message */}
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            U
                        </div>
                        <div className="flex-1">
                            <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-6 py-4">
                                <p className="text-base text-foreground leading-relaxed">
                                    {job.query || 'Research query'}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 ml-1">
                                {new Date(job.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assistant Response Area */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-medium text-primary-foreground shadow-lg">
                            AI
                        </div>
                        <div className="flex-1 min-w-0">
                            {/* Status Indicator */}
                            {job.status !== 'done' && job.status !== 'error' && (
                                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                    {getStatusIcon()}
                                    <span>{getStatusText()}</span>
                                </div>
                            )}

                            {/* Report Content */}
                            {job.data.final ? (
                                <ReportView data={job.data.final} />
                            ) : (
                                <div className="space-y-3">
                                    {/* Progress indicators as chat bubbles */}
                                    {job.data.plan && (
                                        <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                <span>Research plan created with {job.data.plan.search_queries?.length} search queries</span>
                                            </div>
                                        </div>
                                    )}
                                    {job.data.search && (
                                        <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                <span>Found {job.data.search.chunks?.length} relevant sources</span>
                                            </div>
                                        </div>
                                    )}
                                    {job.data.extraction && (
                                        <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                <span>Extracted {job.data.extraction.facts?.length} key insights</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error state */}
                            {job.status === 'error' && job.data.error && (
                                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                    {job.data.error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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
                                            handleFollowUpSubmit();
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
                                onClick={handleFollowUpSubmit}
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
                        <div className="text-xs text-muted-foreground text-center pb-2 px-4">
                            {job?.status === 'done'
                                ? `Ask a follow-up question • Press Enter to submit`
                                : `Research in progress • Viewing job ${jobId.slice(0, 8)}`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
