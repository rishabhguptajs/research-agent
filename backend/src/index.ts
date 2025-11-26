import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createJob, getJob, getJobs, jobEmitter } from './orchestrator/job';
import { clerkMiddleware, requireAuth } from './middleware/auth';
import { connectDB } from './services/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.DEV_MODE === 'true';

app.use(cors());
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
