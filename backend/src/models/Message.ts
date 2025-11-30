import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    messageId: string;
    jobId: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'research' | 'chat';
    status?: 'planning' | 'searching' | 'extracting' | 'compiling' | 'done' | 'error';
    data?: {
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
    createdAt: number;
    updatedAt: number;
}

const MessageSchema = new Schema<IMessage>({
    messageId: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['research', 'chat'] },
    status: {
        type: String,
        enum: ['planning', 'searching', 'extracting', 'compiling', 'done', 'error'],
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdAt: { type: Number, required: true, default: Date.now },
    updatedAt: { type: Number, required: true, default: Date.now }
}, {
    timestamps: false
});

MessageSchema.index({ jobId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
