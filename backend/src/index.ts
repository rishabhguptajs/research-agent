import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from './middleware/auth';
import { connectDB } from './services/db';
import userRoutes from './routes/user.routes';
import jobRoutes from './routes/job.routes';

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

const devAuth = () => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (DEV_MODE) {
        (req as any).auth = { userId: 'dev-user-123' };
    }
    next();
};

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), devMode: DEV_MODE });
});

// Mount routes
app.use('/user', DEV_MODE ? devAuth() : requireAuth(), userRoutes);
app.use('/job', DEV_MODE ? devAuth() : requireAuth(), jobRoutes);
app.use('/jobs', DEV_MODE ? devAuth() : requireAuth(), jobRoutes);

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
