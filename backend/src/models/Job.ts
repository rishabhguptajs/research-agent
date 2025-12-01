import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
    jobId: string;
    userId: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    status: 'active' | 'done' | 'error';
    depth?: 'standard' | 'deep';
    attachedDocuments?: string[];
}

const JobSchema = new Schema<IJob>({
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    createdAt: { type: Number, required: true, default: Date.now },
    updatedAt: { type: Number, required: true, default: Date.now },
    status: {
        type: String,
        required: true,
        enum: ['active', 'done', 'error'],
        default: 'active'
    },
    depth: {
        type: String,
        enum: ['standard', 'deep'],
        default: 'standard'
    },
    attachedDocuments: [{ type: String }]
}, {
    timestamps: false
});

JobSchema.index({ userId: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
