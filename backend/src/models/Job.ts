import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
    jobId: string;
    userId: string;
    query: string;
    createdAt: number;
    updatedAt: number;
    parentJobId?: string;
    type?: 'research' | 'chat';
    status: 'planning' | 'searching' | 'extracting' | 'compiling' | 'done' | 'error';
    data: {
        plan?: {
            sub_questions: string[];
            search_queries: string[];
            extraction_fields: string[];
        };
        search?: {
            collectionName: string;
            chunks: Array<{
                id: string;
                text: string;
                source: string;
            }>;
        };
        extraction?: {
            facts: Array<{
                source: string;
                snippet: string;
                assertion: string;
            }>;
        };
        final?: {
            summary: string;
            detailed: string;
            citations: Array<{
                source: string;
                snippet: string;
            }>;
        };
        error?: string;
    };
}

const JobSchema = new Schema<IJob>({
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    query: { type: String, required: true },
    createdAt: { type: Number, required: true, default: Date.now },
    updatedAt: { type: Number, required: true, default: Date.now },
    parentJobId: { type: String, index: true },
    type: { type: String, enum: ['research', 'chat'], default: 'research' },
    status: {
        type: String,
        required: true,
        enum: ['planning', 'searching', 'extracting', 'compiling', 'done', 'error'],
        default: 'planning'
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: false
});

JobSchema.index({ userId: 1, createdAt: -1 });
JobSchema.index({ status: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
