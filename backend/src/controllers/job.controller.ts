import { Request, Response } from 'express';
import { createJob, getJob, getJobs, jobEmitter } from '../orchestrator/job';
import { User } from '../models/User';

const activeConnections = new Map<string, Response<any, Record<string, any>>>();

export class JobController {
    static async createJob(req: Request, res: Response) {
        const { query, parentJobId, type } = req.body;
        const userId = (req as any).auth.userId;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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

        const jobId = await createJob(query, userId, parentJobId, type);
        res.status(201).json({ jobId });
    }

    static async getJobThread(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        const job = await getJob(id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this job' });
        }

        const thread = await import('../orchestrator/job').then(m => m.getJobThread(id));
        res.json(thread);
    }

    static async getUserJobs(req: Request, res: Response) {
        const userId = (req as any).auth.userId;
        const userJobs = await getJobs(userId);
        res.json(userJobs);
    }

    static async getJobById(req: Request, res: Response) {
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
    }

    static async streamJobUpdates(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;
        const job = await getJob(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this job' });
        }

        // Close existing connection for this job if one exists
        const existingConnection = activeConnections.get(id);
        if (existingConnection) {
            console.log(`[SSE ${id.slice(0, 8)}] Closing existing connection to prevent duplicates`);
            existingConnection.end();
            activeConnections.delete(id);
        }

        // Store this connection
        activeConnections.set(id, res);
        console.log(`[SSE ${id.slice(0, 8)}] New connection established. Active connections: ${activeConnections.size}`);

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

        const onStream = (streamData: any) => {
            if (streamData.jobId === id) {
                console.log(`[SSE ${id.slice(0, 8)}] Stream chunk:`, streamData.chunk.substring(0, 30));
                res.write(`data: ${JSON.stringify({ type: 'stream', chunk: streamData.chunk })}\n\n`);
            }
        };

        jobEmitter.on('update', onUpdate);
        jobEmitter.on('stream', onStream);

        req.on('close', () => {
            console.log(`[SSE ${id.slice(0, 8)}] Connection closed by client`);
            jobEmitter.off('update', onUpdate);
            jobEmitter.off('stream', onStream);
            activeConnections.delete(id);
        });
    }
}
