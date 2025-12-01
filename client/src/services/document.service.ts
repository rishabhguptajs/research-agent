import api from "@/lib/api";

export interface DocumentMetadata {
    documentId: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    uploadedAt: number;
    lastAccessedAt?: number;
}

export interface DocumentWithChunks extends DocumentMetadata {
    chunkIds: string[];
}

export const getUserDocuments = async (token: string): Promise<DocumentMetadata[]> => {
    const response = await api.get('/documents', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const getDocumentById = async (token: string, documentId: string): Promise<DocumentWithChunks> => {
    const response = await api.get(`/documents/${documentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const attachDocumentToJob = async (token: string, documentId: string, jobId: string): Promise<void> => {
    const response = await api.post(
        `/documents/${documentId}/attach/${jobId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

export const detachDocumentFromJob = async (token: string, documentId: string, jobId: string): Promise<void> => {
    const response = await api.delete(`/documents/${documentId}/detach/${jobId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const getJobAttachedDocuments = async (token: string, jobId: string): Promise<DocumentMetadata[]> => {
    const response = await api.get(`/documents/job/${jobId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const getDocumentChunks = async (token: string, documentId: string): Promise<{ documentId: string; chunkIds: string[]; totalChunks: number }> => {
    const response = await api.get(`/documents/${documentId}/chunks`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const deleteDocument = async (token: string, documentId: string): Promise<void> => {
    const response = await api.delete(`/documents/${documentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};
