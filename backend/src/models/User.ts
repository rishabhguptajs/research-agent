import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    userId: string;
    encryptedOpenRouterKey?: string;
    createdAt: number;
    updatedAt: number;
}

const UserSchema = new Schema<IUser>({
    userId: { type: String, required: true, unique: true, index: true },
    encryptedOpenRouterKey: { type: String },
    createdAt: { type: Number, required: true, default: Date.now },
    updatedAt: { type: Number, required: true, default: Date.now },
}, {
    timestamps: false
});

export const User = mongoose.model<IUser>('User', UserSchema);
