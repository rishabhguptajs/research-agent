import api from "@/lib/api";

export interface UploadResponse {
    success: boolean;
    message: string;
    documentId: string;
    chunks: number;
    chunkIds: string[];
}

export const uploadFile = async (token: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });

    return response.data;
};
