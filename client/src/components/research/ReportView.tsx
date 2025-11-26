import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { JobData } from "@/types";

interface Citation {
    source: string;
    snippet: string;
}

export default function ReportView({ data }: { data: JobData['final'] }) {
    const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);

    if (!data) return null;

    // Function to render a single citation badge
    const renderCitationBadge = (citationNumber: number, citation: Citation, index: number) => (
        <span
            key={`citation-${citationNumber}-${index}`}
            className="inline-block relative group mx-0.5"
            style={{ verticalAlign: 'super', fontSize: '0.75em' }}
        >
            <a
                href={citation.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 hover:border-amber-400/60 text-amber-400 hover:text-amber-300 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
                {citationNumber}
            </a>
            <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-3 bg-zinc-900 border border-amber-500/30 rounded-lg shadow-2xl z-[9999] pointer-events-none">
                <div className="text-xs font-semibold text-amber-400 mb-1.5 truncate">
                    {new URL(citation.source).hostname}
                </div>
                <div className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                    "{citation.snippet}"
                </div>
                <ExternalLink className="w-3 h-3 absolute top-3 right-3 text-amber-500/50" />
                {/* Arrow pointer */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="border-8 border-transparent border-t-zinc-900" style={{ filter: 'drop-shadow(0 1px 0 rgba(245, 158, 11, 0.3))' }}></div>
                </div>
            </div>
        </span>
    );

    // Function to process text and replace [N] with clickable citation components
    const processTextWithCitations = (text: string): React.ReactNode[] => {
        if (!text || typeof text !== 'string') return [text];

        const citations = data.citations || [];
        const parts = text.split(/(\[\d+\])/g);

        return parts.map((part, index) => {
            const match = part.match(/\[(\d+)\]/);
            if (match) {
                const citationNumber = parseInt(match[1]);
                const citation = citations[citationNumber - 1];

                if (citation) {
                    return renderCitationBadge(citationNumber, citation, index);
                }
            }
            return <span key={`text-${index}`}>{part}</span>;
        });
    };

    // Recursively process children to handle nested content
    const processChildren = (children: any): any => {
        if (typeof children === 'string') {
            return processTextWithCitations(children);
        }
        if (Array.isArray(children)) {
            return children.map((child, idx) => {
                if (typeof child === 'string') {
                    return processTextWithCitations(child);
                }
                return child;
            });
        }
        return children;
    };

    // Custom markdown components with inline citation support
    const components = {
        p: ({ node, children, ...props }: any) => (
            <p className="leading-7 text-base text-foreground/90 mb-4" {...props}>
                {processChildren(children)}
            </p>
        ),
        h2: ({ node, children, ...props }: any) => (
            <h2 className="text-2xl font-bold tracking-tight mt-10 mb-4 text-foreground" {...props}>
                {processChildren(children)}
            </h2>
        ),
        h3: ({ node, children, ...props }: any) => (
            <h3 className="text-xl font-semibold tracking-tight mt-8 mb-3 text-foreground" {...props}>
                {processChildren(children)}
            </h3>
        ),
        ul: ({ node, ...props }: any) => (
            <ul className="my-4 ml-6 space-y-2 list-disc marker:text-primary" {...props} />
        ),
        li: ({ node, children, ...props }: any) => (
            <li className="text-base text-foreground/90 leading-7" {...props}>
                {processChildren(children)}
            </li>
        ),
        strong: ({ node, children, ...props }: any) => (
            <strong className="font-semibold text-foreground" {...props}>
                {processChildren(children)}
            </strong>
        ),
        em: ({ node, children, ...props }: any) => (
            <em className="italic text-foreground/80" {...props}>
                {processChildren(children)}
            </em>
        ),
        code: ({ node, inline, children, ...props }: any) => (
            inline ?
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-sm" {...props}>
                    {children}
                </code> :
                <code className="block p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto" {...props}>
                    {children}
                </code>
        ),
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Executive Summary - Premium amber style */}
            {data.summary && (
                <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20">
                    <div className="text-base leading-7 text-foreground/90">
                        {processTextWithCitations(data.summary)}
                    </div>
                </div>
            )}

            {/* Detailed Report with inline citations */}
            {data.detailed && (
                <div className="prose-none">
                    <ReactMarkdown components={components}>
                        {data.detailed}
                    </ReactMarkdown>
                </div>
            )}

            {/* Sources footer - premium amber style */}
            {data.citations && data.citations.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                    <h3 className="text-sm font-semibold text-amber-500/80 uppercase tracking-wide mb-4">
                        Sources
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.citations.map((citation, idx) => (
                            <a
                                key={idx}
                                href={citation?.source || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-500/40 hover:from-amber-500/10 hover:to-orange-500/10 transition-all text-sm"
                            >
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-xs font-semibold text-amber-400">
                                    {idx + 1}
                                </span>
                                <span className="text-sm text-foreground/80 group-hover:text-foreground truncate max-w-[200px]">
                                    {citation?.source ? new URL(citation.source).hostname : 'Unknown'}
                                </span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500/60" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
