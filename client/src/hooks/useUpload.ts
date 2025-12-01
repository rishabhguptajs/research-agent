import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { uploadFile, UploadResponse } from '../services/upload.service';
import toast from 'react-hot-toast';

export function useUpload(onUploadSuccess?: (response: UploadResponse) => void) {
    const { getToken } = useAuth();
    const [isUploading, setIsUploading] = useState(false);

    const upload = async (file: File): Promise<UploadResponse | null> => {
        setIsUploading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            const response = await uploadFile(token, file);
            toast.success(`${file.name} uploaded successfully`);

            if (onUploadSuccess) {
                onUploadSuccess(response);
            }

            return response;
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error.message || "Failed to upload file");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { upload, isUploading };
}

export function useUploadWithRefresh() {
    const { getToken } = useAuth();
    const [isUploading, setIsUploading] = useState(false);

    const upload = async (file: File, refreshCallback?: () => void): Promise<UploadResponse | null> => {
        setIsUploading(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');

            const response = await uploadFile(token, file);
            toast.success(`${file.name} uploaded successfully`);

            if (refreshCallback) {
                refreshCallback();
            }

            return response;
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error.message || "Failed to upload file");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { upload, isUploading };
}
