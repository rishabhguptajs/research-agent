import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from './middleware/auth';
import { connectDB } from './services/db';
import userRoutes from './routes/user.routes';
import jobRoutes from './routes/job.routes';
import uploadRoutes from './routes/upload.routes';
import { documentsRoutes } from './routes/documents.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.DEV_MODE === 'true';

const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) !== -1 || DEV_MODE) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

if (!DEV_MODE) {
    app.use(clerkMiddleware());
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), devMode: DEV_MODE });
});

app.use('/user', requireAuth(), userRoutes);
app.use('/job', requireAuth(), jobRoutes);
app.use('/jobs', requireAuth(), jobRoutes);
app.use('/upload', requireAuth(), uploadRoutes);
app.use('/documents', requireAuth(), documentsRoutes);

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Dev mode: ${DEV_MODE}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
