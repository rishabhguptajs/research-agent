import { useState } from 'react';
import { useDocuments, useJobDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Plus, X, FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface DocumentAttachmentPanelProps {
    jobId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function DocumentAttachmentPanel({ jobId, isOpen, onClose }: DocumentAttachmentPanelProps) {
    const { documents, isLoading: documentsLoading, attachToJob, detachFromJob } = useDocuments();
    const { attachedDocuments, isLoading: attachedLoading, fetchAttachedDocuments } = useJobDocuments(jobId);
    const [attachingDocId, setAttachingDocId] = useState<string | null>(null);
    const [detachingDocId, setDetachingDocId] = useState<string | null>(null);

    const handleAttachDocument = async (documentId: string) => {
        setAttachingDocId(documentId);
        try {
            await attachToJob(documentId, jobId);
            await fetchAttachedDocuments();
        } catch (error) {
            // Error already handled in hook
        } finally {
            setAttachingDocId(null);
        }
    };

    const handleDetachDocument = async (documentId: string) => {
        setDetachingDocId(documentId);
        try {
            await detachFromJob(documentId, jobId);
            await fetchAttachedDocuments();
        } catch (error) {
            // Error already handled in hook
        } finally {
            setDetachingDocId(null);
        }
    };

    const isDocumentAttached = (documentId: string) => {
        return attachedDocuments.some(doc => doc.documentId === documentId);
    };

    const availableDocuments = documents.filter(doc => !isDocumentAttached(doc.documentId));

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Attach Documents to Chat"
            description="Attach uploaded documents to provide context for your chat conversation."
            className="max-w-4xl w-full max-h-[80vh] overflow-hidden"
        >
            <div className="space-y-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* Attached Documents Section */}
                {attachedDocuments.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Paperclip className="w-5 h-5" />
                            Attached Documents ({attachedDocuments.length})
                        </h3>
                        <div className="space-y-3">
                            {attachedDocuments.map((doc) => (
                                <Card key={doc.documentId} className="border-green-200 bg-green-50/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <h4 className="font-medium text-sm">{doc.fileName}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{formatFileSize(doc.fileSize)}</span>
                                                        <span>•</span>
                                                        <span>{doc.totalChunks} chunks</span>
                                                        <span>•</span>
                                                        <span>{formatDate(doc.uploadedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                    Attached
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDetachDocument(doc.documentId)}
                                                    disabled={detachingDocId === doc.documentId}
                                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                                                >
                                                    {detachingDocId === doc.documentId ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <X className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Documents Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Available Documents ({availableDocuments.length})
                    </h3>

                    {documentsLoading || attachedLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="ml-2">Loading documents...</span>
                        </div>
                    ) : availableDocuments.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="p-8 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="font-medium mb-2">No documents available</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Upload documents using the paperclip icon in the chat input to make them available for attachment.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {availableDocuments.map((doc) => (
                                <Card key={doc.documentId} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <h4 className="font-medium text-sm">{doc.fileName}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{formatFileSize(doc.fileSize)}</span>
                                                        <span>•</span>
                                                        <span>{doc.totalChunks} chunks</span>
                                                        <span>•</span>
                                                        <span>{formatDate(doc.uploadedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAttachDocument(doc.documentId)}
                                                disabled={attachingDocId === doc.documentId}
                                                className="hover:bg-blue-50 hover:border-blue-200"
                                            >
                                                {attachingDocId === doc.documentId ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Attaching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Attach
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
