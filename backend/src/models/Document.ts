import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
    documentId: string;
    userId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    collectionName: string; 
    chunkIds: string[];
    totalChunks: number;
    uploadedAt: number;
    lastAccessedAt?: number;
}

const DocumentSchema = new Schema<IDocument>({
    documentId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    collectionName: { type: String, required: true, index: true },
    chunkIds: [{ type: String }],
    totalChunks: { type: Number, required: true, default: 0 },
    uploadedAt: { type: Number, required: true, default: Date.now },
    lastAccessedAt: { type: Number }
}, {
    timestamps: false
});

DocumentSchema.index({ userId: 1, uploadedAt: -1 });
DocumentSchema.index({ collectionName: 1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
