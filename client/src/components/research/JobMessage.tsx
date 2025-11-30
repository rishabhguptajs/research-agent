import { Message } from "@/types";
import ReportView from "./ReportView";
import { useMobile } from "@/hooks/use-mobile";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AnimatedDots } from "@/components/ui/AnimatedDots";

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'done': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return <Clock className="w-4 h-4 text-primary animate-pulse" />;
    }
};

const getStatusText = (message: Message) => {
    switch (message.status) {
        case 'planning':
        case 'searching':
        case 'extracting':
        case 'compiling':
            return 'Researching';
        case 'done':
            return 'Research complete';
        case 'error':
            return 'Research failed';
        default:
            return 'Processing';
    }
};

interface JobMessageProps {
    message: Message;
    userImageUrl?: string;
    isLast?: boolean;
}

export function JobMessage({ message, userImageUrl, isLast }: JobMessageProps) {
    const isMobile = useMobile();
    const formattedDate = new Date(message.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    if (message.role === 'user') {
        return (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center overflow-hidden">
                        {userImageUrl ? (
                            <img src={userImageUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-medium text-accent-foreground">U</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`text-foreground font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                            {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{formattedDate}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-medium text-primary-foreground shadow-lg">
                    AI
                </div>
                <div className="flex-1 min-w-0">
                    {message.status !== 'done' && message.status !== 'error' && (
                        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                            {getStatusIcon(message.status || 'planning')}
                            <span>{getStatusText(message)}<AnimatedDots /></span>
                        </div>
                    )}

                    {message.type === 'chat' ? (
                        <div
                            key={`chat-${message.messageId}-${message.data?.final?.detailed?.length || 0}`}
                            className="prose prose-sm dark:prose-invert max-w-none"
                        >
                            {message.data?.final?.detailed || message.content}
                        </div>
                    ) : (
                        message.data?.final ? (
                            <div className="relative">
                                <ReportView data={message.data.final} />
                                {(message.status === 'compiling' || message.status === 'planning') && message.data.final.detailed && (
                                    <span className="inline-block w-2 h-4 ml-2 bg-primary animate-pulse"></span>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {message.data?.plan && (
                                    <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>Research plan created with {message.data.plan.search_queries?.length} search queries</span>
                                        </div>
                                    </div>
                                )}
                                {message.data?.search && (
                                    <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>Found {message.data.search.chunks?.length} relevant sources</span>
                                        </div>
                                    </div>
                                )}
                                {message.data?.extraction && (
                                    <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>Extracted {message.data.extraction.facts?.length} key insights</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {message.status === 'error' && message.data?.error && (
                        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {message.data.error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
