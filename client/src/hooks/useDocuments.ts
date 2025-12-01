import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    getUserDocuments,
    getDocumentById,
    attachDocumentToJob,
    detachDocumentFromJob,
    getJobAttachedDocuments,
    deleteDocument,
    DocumentMetadata,
    DocumentWithChunks
} from '../services/document.service';
import toast from 'react-hot-toast';

export function useDocuments() {
    const { getToken } = useAuth();
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            const docs = await getUserDocuments(token);
            setDocuments(docs);
        } catch (error: any) {
            console.error('Failed to fetch documents:', error);
            toast.error(error.message || 'Failed to fetch documents');
        } finally {
            setIsLoading(false);
        }
    };

    const getDocument = async (documentId: string): Promise<DocumentWithChunks | null> => {
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            return await getDocumentById(token, documentId);
        } catch (error: any) {
            console.error('Failed to fetch document:', error);
            toast.error(error.message || 'Failed to fetch document');
            return null;
        }
    };

    const attachToJob = async (documentId: string, jobId: string) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            await attachDocumentToJob(token, documentId, jobId);
            toast.success('Document attached to chat');
        } catch (error: any) {
            console.error('Failed to attach document:', error);
            toast.error(error.message || 'Failed to attach document');
            throw error;
        }
    };

    const detachFromJob = async (documentId: string, jobId: string) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            await detachDocumentFromJob(token, documentId, jobId);
            toast.success('Document detached from chat');
        } catch (error: any) {
            console.error('Failed to detach document:', error);
            toast.error(error.message || 'Failed to detach document');
            throw error;
        }
    };

    const removeDocument = async (documentId: string) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            await deleteDocument(token, documentId);
            setDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
            toast.success('Document deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete document:', error);
            toast.error(error.message || 'Failed to delete document');
            throw error;
        }
    };

    const refreshDocuments = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    return {
        documents,
        isLoading,
        fetchDocuments,
        refreshDocuments,
        getDocument,
        attachToJob,
        detachFromJob,
        removeDocument
    };
}

export function useJobDocuments(jobId: string) {
    const { getToken } = useAuth();
    const [attachedDocuments, setAttachedDocuments] = useState<DocumentMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAttachedDocuments = async () => {
        if (!jobId) return;

        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            const docs = await getJobAttachedDocuments(token, jobId);
            setAttachedDocuments(docs);
        } catch (error: any) {
            console.error('Failed to fetch attached documents:', error);
            toast.error(error.message || 'Failed to fetch attached documents');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttachedDocuments();
    }, [jobId]);

    return {
        attachedDocuments,
        isLoading,
        fetchAttachedDocuments,
        setAttachedDocuments
    };
}
