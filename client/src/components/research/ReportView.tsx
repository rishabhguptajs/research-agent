import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { JobData } from "@/types";
import SourcesModal from './SourcesModal';
import { useMobile } from "@/hooks/use-mobile";
import { CitationBadge } from './CitationBadge';

export default function ReportView({ data }: { data: JobData['final'] }) {
    const isMobile = useMobile();

    if (!data) return null;

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
                    return <CitationBadge key={`citation-${citationNumber}-${index}`} citationNumber={citationNumber} citation={citation} index={index} />;
                }
            }
            return <span key={`text-${index}`}>{part}</span>;
        });
    };

    const processChildren = (children: React.ReactNode): React.ReactNode => {
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



    const components = {
        p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'> & { node?: unknown }) => (
            <p className={`leading-7 text-foreground/90 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`} {...props}>
                {processChildren(children)}
            </p>
        ),
        h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'> & { node?: unknown }) => (
            <h2 className={`font-bold tracking-tight mt-10 mb-4 text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`} {...props}>
                {processChildren(children)}
            </h2>
        ),
        h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'> & { node?: unknown }) => (
            <h3 className={`font-semibold tracking-tight mt-8 mb-3 text-foreground ${isMobile ? 'text-lg' : 'text-xl'}`} {...props}>
                {processChildren(children)}
            </h3>
        ),
        ul: ({ ...props }: React.ComponentPropsWithoutRef<'ul'> & { node?: unknown }) => (
            <ul className="my-4 ml-6 space-y-2 list-disc marker:text-primary" {...props} />
        ),
        li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'> & { node?: unknown }) => (
            <li className={`text-foreground/90 leading-7 ${isMobile ? 'text-sm' : 'text-base'}`} {...props}>
                {processChildren(children)}
            </li>
        ),
        strong: ({ children, ...props }: React.ComponentPropsWithoutRef<'strong'> & { node?: unknown }) => (
            <strong className="font-semibold text-foreground" {...props}>
                {processChildren(children)}
            </strong>
        ),
        em: ({ children, ...props }: React.ComponentPropsWithoutRef<'em'> & { node?: unknown }) => (
            <em className="italic text-foreground/80" {...props}>
                {processChildren(children)}
            </em>
        ),
        code: ({ inline, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { node?: unknown, inline?: boolean }) => (
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
            {data.summary && (
                <div className={`mb-8 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 ${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className={`leading-7 text-foreground/90 ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {processTextWithCitations(data.summary)}
                    </div>
                </div>
            )}

            {data.detailed && (
                <div className="prose-none">
                    <ReactMarkdown components={components}>
                        {data.detailed}
                    </ReactMarkdown>
                </div>
            )}

            {data.citations && data.citations.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                    <SourcesModal citations={data.citations} />
                </div>
            )}
        </div>
    );
}
