import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { JobData } from "@/types";
import SourcesModal from './SourcesModal';
import { useMobile } from "@/hooks/use-mobile";

interface Citation {
    source: string;
    snippet: string;
}

export default function ReportView({ data }: { data: JobData['final'] }) {
    const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);

    if (!data) return null;

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
            <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-3 bg-zinc-900 border border-amber-500/30 rounded-lg shadow-2xl z-[9999] pointer-events-none">
                <span className="text-xs font-semibold text-amber-400 mb-1.5 truncate" style={{ display: 'block' }}>
                    {new URL(citation.source).hostname}
                </span>
                <span className="text-xs text-zinc-300 line-clamp-3 leading-relaxed" style={{ display: 'block' }}>
                    "{citation.snippet}"
                </span>
                <ExternalLink className="w-3 h-3 absolute top-3 right-3 text-amber-500/50" />
                {/* Arrow pointer */}
                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px" style={{ display: 'block' }}>
                    <span className="border-8 border-transparent border-t-zinc-900" style={{ filter: 'drop-shadow(0 1px 0 rgba(245, 158, 11, 0.3))', display: 'block' }}></span>
                </span>
            </span>
        </span>
    );

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

    const isMobile = useMobile();

    // Custom markdown components with inline citation support
    const components = {
        p: ({ node, children, ...props }: any) => (
            <p className={`leading-7 text-foreground/90 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`} {...props}>
                {processChildren(children)}
            </p>
        ),
        h2: ({ node, children, ...props }: any) => (
            <h2 className={`font-bold tracking-tight mt-10 mb-4 text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`} {...props}>
                {processChildren(children)}
            </h2>
        ),
        h3: ({ node, children, ...props }: any) => (
            <h3 className={`font-semibold tracking-tight mt-8 mb-3 text-foreground ${isMobile ? 'text-lg' : 'text-xl'}`} {...props}>
                {processChildren(children)}
            </h3>
        ),
        ul: ({ node, ...props }: any) => (
            <ul className="my-4 ml-6 space-y-2 list-disc marker:text-primary" {...props} />
        ),
        li: ({ node, children, ...props }: any) => (
            <li className={`text-foreground/90 leading-7 ${isMobile ? 'text-sm' : 'text-base'}`} {...props}>
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
                <div className={`mb-8 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 ${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className={`leading-7 text-foreground/90 ${isMobile ? 'text-sm' : 'text-base'}`}>
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

            {/* Sources modal - compact */}
            {data.citations && data.citations.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                    <SourcesModal citations={data.citations} />
                </div>
            )}
        </div>
    );
}
