import { Search, Sparkles, ArrowRight, AlertTriangle, Paperclip, Loader2, X, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobile } from "@/hooks/use-mobile";
import { useModePreference, ResearchMode } from "@/hooks/useModePreference";
import { useUploadWithRefresh } from "@/hooks/useUpload";
import { attachDocumentToJob, detachDocumentFromJob } from "@/services/document.service";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import toast from "react-hot-toast";


interface ChatInputProps {
    onSubmit: (query: string, isResearchMode: boolean, depth: 'standard' | 'deep') => void;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
    defaultMode?: 'chat' | 'research';
    hasOpenRouterKey?: boolean;
    hasTavilyKey?: boolean;
    isSignedIn?: boolean;
    checkingKey?: boolean;
    onDocumentUpload?: () => void; // Callback to refresh documents list
    jobId?: string; // If provided, uploaded documents will be auto-attached to this job
    onDocumentAttached?: (doc: { documentId: string; fileName: string }) => void; // Callback when doc is attached
}

interface AttachedDocument {
    documentId: string;
    fileName: string;
}

export default function ChatInput({
    onSubmit,
    isLoading = false,
    disabled = false,
    placeholder,
    autoFocus = false,
    defaultMode = 'chat',
    hasOpenRouterKey = true,
    hasTavilyKey = true,
    isSignedIn = false,
    checkingKey = false,
    onDocumentUpload,
    jobId,
    onDocumentAttached
}: ChatInputProps) {
    const isMobile = useMobile();
    const [query, setQuery] = useState('');
    const [depth, setDepth] = useState<'standard' | 'deep'>('standard');
    const { mode, setMode, isInitialized } = useModePreference(defaultMode as ResearchMode);
    const isResearchMode = mode === 'research';

    const { upload, isUploading } = useUploadWithRefresh();
    const { getToken } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
    const [isAttaching, setIsAttaching] = useState(false);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const response = await upload(file, onDocumentUpload);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // If we have a jobId and upload was successful, auto-attach the document
            if (response && jobId) {
                setIsAttaching(true);
                try {
                    const token = await getToken();
                    if (token) {
                        await attachDocumentToJob(token, response.documentId, jobId);
                        const newDoc = { documentId: response.documentId, fileName: file.name };
                        setAttachedDocs(prev => [...prev, newDoc]);
                        onDocumentAttached?.(newDoc);
                        toast.success(`${file.name} attached to chat`);
                    }
                } catch (error) {
                    console.error('Failed to auto-attach document:', error);
                    toast.error('Document uploaded but failed to attach to chat');
                } finally {
                    setIsAttaching(false);
                }
            }
        }
    };

    const handleRemoveAttachedDoc = async (doc: AttachedDocument) => {
        if (!jobId) return;
        
        try {
            const token = await getToken();
            if (token) {
                await detachDocumentFromJob(token, doc.documentId, jobId);
                setAttachedDocs(prev => prev.filter(d => d.documentId !== doc.documentId));
                toast.success(`${doc.fileName} detached`);
            }
        } catch (error) {
            console.error('Failed to detach document:', error);
            toast.error('Failed to detach document');
        }
    };

    const showValidationOverlay = isSignedIn && !checkingKey && (!hasOpenRouterKey || !hasTavilyKey);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !disabled && !isLoading && !showValidationOverlay) {
            onSubmit(query.trim(), isResearchMode, depth);
            setQuery('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full relative">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className={`relative flex flex-col bg-background border border-border rounded-xl shadow-sm overflow-hidden transition-all focus-within:ring-1 focus-within:ring-ring focus-within:border-primary/50 ${isMobile ? 'p-2' : 'p-3'}`}>

                    {/* Attached Documents Display */}
                    {attachedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 px-1">
                            {attachedDocs.map((doc) => (
                                <div
                                    key={doc.documentId}
                                    className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5 text-xs group animate-in fade-in slide-in-from-bottom-2 duration-200"
                                >
                                    <FileText className="w-3.5 h-3.5 text-primary/70" />
                                    <span className="text-foreground/80 max-w-[150px] truncate" title={doc.fileName}>
                                        {doc.fileName}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAttachedDoc(doc)}
                                        className="text-muted-foreground hover:text-destructive transition-colors opacity-60 group-hover:opacity-100"
                                        title="Remove attachment"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {isAttaching && (
                                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-xs">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                    <span className="text-muted-foreground">Attaching...</span>
                                </div>
                            )}
                        </div>
                    )}

                    <Input
                        type="text"
                        placeholder={placeholder || (isMobile ? "Research topic..." : "Ask anything...")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={`border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 px-2 ${isMobile ? 'text-base h-10' : 'text-lg h-12'}`}
                        autoFocus={autoFocus}
                        disabled={disabled || isLoading || showValidationOverlay}
                    />

                    <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.txt,.md"
                            />
                            <button
                                type="button"
                                onClick={handleFileClick}
                                className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                title="Upload Document"
                                disabled={disabled || isLoading || isUploading || showValidationOverlay}
                            >
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Paperclip className="w-4 h-4" />
                                )}
                            </button>
                            <div className="w-px h-4 bg-border/50 mx-1"></div>

                            <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50">
                                <button
                                    type="button"
                                    onClick={() => setMode('chat')}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${!isResearchMode
                                        ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="Chat Mode"
                                    disabled={disabled || isLoading || showValidationOverlay}
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-border/50 mx-1"></div>
                                <button
                                    type="button"
                                    onClick={() => setMode('research')}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${isResearchMode
                                        ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="Research Mode"
                                    disabled={disabled || isLoading || showValidationOverlay}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
                            </div>

                            {isResearchMode && (
                                <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/50 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <button
                                        type="button"
                                        onClick={() => setDepth('standard')}
                                        className={`px-3 h-8 rounded-full text-xs font-medium transition-all duration-200 ${depth === 'standard'
                                            ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        disabled={disabled || isLoading || showValidationOverlay}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDepth('deep')}
                                        className={`px-3 h-8 rounded-full text-xs font-medium transition-all duration-200 ${depth === 'deep'
                                            ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        disabled={disabled || isLoading || showValidationOverlay}
                                        title="Uses more API credits"
                                    >
                                        Deep
                                    </button>
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim() || disabled || showValidationOverlay}
                            size="icon"
                            className={`rounded-full transition-all duration-300 ${query.trim()
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                } ${isMobile ? 'h-9 w-9' : 'h-10 w-10'}`}
                        >
                            {isLoading ? (
                                <Sparkles className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    {showValidationOverlay && (
                        <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 max-w-[90%] mx-auto">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-amber-500">API Keys Required</span>
                                    <span className="text-xs text-muted-foreground">
                                        Configure {!hasOpenRouterKey && !hasTavilyKey ? 'OpenRouter & Tavily' : !hasOpenRouterKey ? 'OpenRouter' : 'Tavily'} keys to continue.
                                    </span>
                                </div>
                                <Link href="/dashboard" className="ml-2">
                                    <Button size="sm" variant="outline" className="h-7 cursor-pointer text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">
                                        Configure
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isResearchMode && depth === 'deep' && (
                <div className="absolute -bottom-6 left-0 right-0 text-center">
                    <span className="text-[10px] text-amber-500/80 font-mono flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Deep Research consumes significantly more API credits
                    </span>
                </div>
            )}
        </form>
    );
}
