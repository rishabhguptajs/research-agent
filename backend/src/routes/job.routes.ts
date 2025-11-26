import { Router } from 'express';
import { createJob, getJob, getJobs, jobEmitter } from '../orchestrator/job';
import { User } from '../models/User';

const router = Router();

// POST /job - Create a new research job
router.post('/', async (req, res) => {
    const { query } = req.body;
    const userId = (req as any).auth.userId;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has both API keys configured
    try {
        const user = await User.findOne({ userId });

        if (!user || !user.encryptedOpenRouterKey) {
            return res.status(403).json({
                error: 'API key not configured',
                message: 'Please configure your OpenRouter API key in the dashboard before creating research jobs'
            });
        }

        if (!user.encryptedTavilyKey) {
            return res.status(403).json({
                error: 'API key not configured',
                message: 'Please configure your Tavily API key in the dashboard before creating research jobs'
            });
        }
    } catch (error) {
        console.error('Error checking user API keys:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }

    const jobId = await createJob(query, userId);
    res.status(201).json({ jobId });
});

// GET /jobs - Get all jobs for the authenticated user
router.get('/', async (req, res) => {
    const userId = (req as any).auth.userId;
    const userJobs = await getJobs(userId);
    res.json(userJobs);
});

// GET /job/:id - Get a specific job by ID
router.get('/:id', async (req, res) => {
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

// GET /job/:id/stream - Stream job updates via SSE
router.get('/:id/stream', async (req, res) => {
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

export default router;
