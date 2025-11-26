import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createJob, getJob, getJobs, jobEmitter } from './orchestrator/job';
import { clerkMiddleware, requireAuth } from './middleware/auth';
import { connectDB } from './services/db';
import { User } from './models/User';
import { encrypt, decrypt } from './services/crypto';


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

app.post('/job', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const { query } = req.body;
    const userId = req.auth.userId;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has API key configured
    try {
        const user = await User.findOne({ userId });
        if (!user || !user.encryptedOpenRouterKey) {
            return res.status(403).json({
                error: 'API key not configured',
                message: 'Please configure your OpenRouter API key in the dashboard before creating research jobs'
            });
        }
    } catch (error) {
        console.error('Error checking user API key:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }

    const jobId = await createJob(query, userId);
    res.status(201).json({ jobId });
});

app.get('/jobs', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const userId = (req as any).auth.userId;
    const userJobs = await getJobs(userId);
    res.json(userJobs);
});

app.get('/job/:id', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).auth.userId;
    const job = await getJob(id);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this job' });
    }

    res.json(job);
});

app.get('/job/:id/stream', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).auth.userId;
    const job = await getJob(id);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this job' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({ status: job.status, data: job.data, query: job.query, createdAt: job.createdAt })}\n\n`);

    const onUpdate = (update: any) => {
        if (update.jobId === id) {
            res.write(`data: ${JSON.stringify(update)}\n\n`);
            if (update.status === 'done' || update.status === 'error') {
                res.end();
            }
        }
    };

    jobEmitter.on('update', onUpdate);

    req.on('close', () => {
        jobEmitter.off('update', onUpdate);
    });
});

app.get('/user/key', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const userId = (req as any).auth.userId;
    try {
        const user = await User.findOne({ userId });
        res.json({ hasKey: !!user?.encryptedOpenRouterKey });
    } catch (error) {
        console.error('Error fetching user key status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/user/key', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const userId = (req as any).auth.userId;
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        const encryptedKey = encrypt(key);
        await User.findOneAndUpdate(
            { userId },
            { userId, encryptedOpenRouterKey: encryptedKey, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving user key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/user/key', DEV_MODE ? devAuth() : requireAuth(), async (req, res) => {
    const userId = (req as any).auth.userId;
    try {
        await User.findOneAndUpdate(
            { userId },
            { $unset: { encryptedOpenRouterKey: "" }, updatedAt: Date.now() }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
