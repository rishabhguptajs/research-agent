import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn('Warning: MONGODB_URI is not set. Jobs will not persist.');
}

let isConnected = false;

export async function connectDB() {
    if (isConnected) {
        return;
    }

    if (!MONGODB_URI) {
        console.warn('Skipping MongoDB connection: MONGODB_URI not configured');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('✓ Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

export function isDBConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}
