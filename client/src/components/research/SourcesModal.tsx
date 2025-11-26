"use client";

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from 'lucide-react';
import { Citation } from '@/types';

interface SourcesModalProps {
    citations: Citation[];
}

export default function SourcesModal({ citations }: SourcesModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!citations || citations.length === 0) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs font-medium text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 px-3 py-1.5 rounded-full transition-all flex items-center gap-2"
            >
                View {citations.length} Sources
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[95vw] max-w-3xl max-h-[80vh] flex flex-col rounded-lg p-0 gap-0">
                    <DialogHeader className="p-6 pb-2 border-b border-border/40">
                        <DialogTitle className="text-2xl font-bold text-amber-500">
                            Sources & References
                        </DialogTitle>
                        <DialogDescription>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-6 pt-4 overflow-y-auto">
                        {citations.map((citation, idx) => (
                            <a
                                key={idx}
                                href={citation?.source || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block p-4 rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:border-amber-500/40 hover:from-amber-500/10 hover:to-orange-500/10 transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-sm font-semibold text-amber-400">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-semibold text-foreground group-hover:text-amber-400 transition-colors truncate max-w-[200px] sm:max-w-md">
                                                {citation.title || new URL(citation.source).hostname}
                                            </h4>
                                            <ExternalLink className="w-4 h-4 flex-shrink-0 text-amber-500/60 group-hover:text-amber-400 transition-colors" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2 truncate max-w-[250px] sm:max-w-lg">
                                            {citation.source}
                                        </p>
                                        <p className="text-sm text-foreground/70 line-clamp-3">
                                            "{citation.snippet}"
                                        </p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
