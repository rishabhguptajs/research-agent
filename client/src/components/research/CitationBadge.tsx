import { ExternalLink } from "lucide-react";

interface Citation {
    source: string;
    snippet: string;
}

interface CitationBadgeProps {
    citationNumber: number;
    citation: Citation;
    index: number;
}

export function CitationBadge({ citationNumber, citation, index }: CitationBadgeProps) {
    return (
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
}
