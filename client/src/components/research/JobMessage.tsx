import { JobStatus } from "@/types";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import ReportView from "./ReportView";

interface JobMessageProps {
    job: JobStatus;
    userImageUrl?: string;
    isLast: boolean;
}

export function JobMessage({ job, userImageUrl, isLast }: JobMessageProps) {
    const getStatusIcon = (status: string) => {
        if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    };

    const getStatusText = (job: JobStatus) => {
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
        <div key={job.jobId} className="contents">
            {/* User Query */}
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary overflow-hidden">
                        {userImageUrl ? (
                            <img src={userImageUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            "U"
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-6 py-4">
                            <p className="text-base text-foreground leading-relaxed">
                                {job.query}
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

            {/* Assistant Response */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-medium text-primary-foreground shadow-lg">
                        AI
                    </div>
                    <div className="flex-1 min-w-0">
                        {/* Status Indicator */}
                        {job.status !== 'done' && job.status !== 'error' && (
                            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                {getStatusIcon(job.status)}
                                <span>{getStatusText(job)}</span>
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
        </div>
    );
}
