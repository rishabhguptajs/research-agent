"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useJobStream } from "@/hooks/useJobStream";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, XCircle, Paperclip } from "lucide-react";
import { exportJobToPdf, getJobPdfBlobUrl } from "@/utils/pdf-export";
import { JobMessage } from "@/components/research/JobMessage";
import ChatInput from "@/components/research/ChatInput";
import { useResearchForm } from "@/hooks/useResearchForm";
import { Modal } from "@/components/ui/Modal";
import { sendMessage } from "@/services/job.service";
import { Loader } from "@/components/ui/Loader";
import DocumentAttachmentPanel from "@/components/research/DocumentAttachmentPanel";
import { useDocuments } from "@/hooks/useDocuments";

export default function JobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;
    const { job, messages, error, isConnected } = useJobStream(jobId);
    const { getToken } = useAuth();
    const { user } = useUser();
    const bottomRef = useRef<HTMLDivElement>(null);

    const { hasOpenRouterKey, hasTavilyKey, checkingKey, isSignedIn } = useResearchForm();
    const { refreshDocuments } = useDocuments();

    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDocumentPanel, setShowDocumentPanel] = useState(false);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length, job]);

    const handleExportPDF = () => {
        if (job && messages.length > 0) {
            const blobUrl = getJobPdfBlobUrl(job, messages);
            if (blobUrl) {
                setPdfPreviewUrl(blobUrl.toString());
                setShowExportConfirm(true);
            }
        }
    };

    const confirmExport = () => {
        if (job && messages.length > 0) {
            exportJobToPdf(job, messages);
            setShowExportConfirm(false);
            setPdfPreviewUrl(null);
        }
    };

    const handleCloseExport = () => {
        setShowExportConfirm(false);
        setPdfPreviewUrl(null);
    };

    const handleSubmit = async (query: string, isDeepResearch: boolean) => {
        if (!job) return;
        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (!token) return;

            await sendMessage(token, job.jobId, query, isDeepResearch ? 'research' : 'chat');
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setIsSubmitting(false);
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

    if (!job && !error) {
        return <Loader fullScreen text="Loading conversation..." />;
    }

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const defaultMode = lastMessage?.type === 'chat' ? 'chat' : 'research';

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/")}
                            className="hover:bg-accent"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Home
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDocumentPanel(true)}
                                disabled={!job || job.status !== 'active'}
                                className="hover:bg-blue-500/10 cursor-pointer hover:border-blue-500/40 hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Paperclip className="w-4 h-4 mr-2" />
                                Attach Docs
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportPDF}
                                disabled={!job || messages.length === 0 || job.status !== 'active'}
                                className="hover:bg-amber-500/10 cursor-pointer hover:border-amber-500/40 hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className="font-mono cursor-pointer tracking-wider bg-primary/5 border border-primary/10 text-primary/90 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300"
                                >
                                    Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
                {messages.map((msg, index) => (
                    <JobMessage
                        key={`${msg.messageId}-${msg.data?.final?.detailed?.length || 0}`}
                        message={msg}
                        userImageUrl={user?.imageUrl}
                        isLast={index === messages.length - 1}
                    />
                ))}

                <div ref={bottomRef} />
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/0 pt-8 pb-4">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ChatInput
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={job?.status !== 'active'}
                        placeholder="Ask a follow-up question..."
                        defaultMode={defaultMode}
                        hasOpenRouterKey={hasOpenRouterKey}
                        hasTavilyKey={hasTavilyKey}
                        isSignedIn={isSignedIn}
                        checkingKey={checkingKey}
                        onDocumentUpload={refreshDocuments}
                        jobId={jobId}
                    />
                </div>
            </div>

            <Modal
                isOpen={showExportConfirm}
                onClose={handleCloseExport}
                title="Export Research Report"
                description="Preview the generated PDF report below."
                className="max-w-4xl w-full"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <Button variant="outline" onClick={handleCloseExport}>
                            Cancel
                        </Button>
                        <Button onClick={confirmExport} className="bg-amber-500 hover:bg-amber-600 text-white">
                            Download PDF
                        </Button>
                    </div>
                }
            >
                {pdfPreviewUrl && (
                    <div className="w-full h-[60vh] bg-muted/20 rounded-lg overflow-hidden border border-border">
                        <iframe
                            src={pdfPreviewUrl}
                            className="w-full h-full"
                            title="PDF Preview"
                        />
                    </div>
                )}
            </Modal>

            <DocumentAttachmentPanel
                jobId={jobId}
                isOpen={showDocumentPanel}
                onClose={() => setShowDocumentPanel(false)}
            />
        </div>
    );
}
