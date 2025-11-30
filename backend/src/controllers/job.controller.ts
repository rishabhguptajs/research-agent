import { Request, Response } from 'express';
import { createJob, addMessage, getJob, getJobs, jobEmitter } from '../orchestrator/job';
import { User } from '../models/User';
import { Job } from '../models/Job';

const activeConnections = new Map<string, Response<any, Record<string, any>>>();

export class JobController {
    static async createJob(req: Request, res: Response) {
        const { query, type } = req.body;
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

        const jobId = await createJob(query, userId, type);
        res.status(201).json({ jobId });
    }

    static async addMessage(req: Request, res: Response) {
        const { id } = req.params;
        const { message, type } = req.body;
        const userId = (req as any).auth.userId;

        if (!message) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const job = await Job.findOne({ jobId: id });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this job' });
        }

        const messageId = await addMessage(id, message, type);
        res.status(201).json({ messageId });
    }

    static async getUserJobs(req: Request, res: Response) {
        const userId = (req as any).auth.userId;
        const userJobs = await getJobs(userId);
        res.json(userJobs);
    }

    static async getJobById(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        const jobData = await getJob(id);

        if (!jobData) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (jobData.job.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this job' });
        }

        res.json(jobData);
    }

    static async streamJobUpdates(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        const jobData = await getJob(id);

        if (!jobData) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (jobData.job.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You do not own this job' });
        }

        const existingConnection = activeConnections.get(id);
        if (existingConnection) {
            console.log(`[SSE ${id.slice(0, 8)}] Closing existing connection to prevent duplicates`);
            existingConnection.end();
            activeConnections.delete(id);
        }

        activeConnections.set(id, res);
        console.log(`[SSE ${id.slice(0, 8)}] New connection established. Active connections: ${activeConnections.size}`);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        res.write(`data: ${JSON.stringify({ type: 'init', job: jobData.job, messages: jobData.messages })}\n\n`);

        jobEmitter.removeAllListeners('update');

        const onUpdate = (update: any) => {
            if (update.jobId === id) {
                res.write(`data: ${JSON.stringify(update)}\n\n`);
            }
        };

        jobEmitter.on('update', onUpdate);

        req.on('close', () => {
            jobEmitter.off('update', onUpdate);
            activeConnections.delete(id);
        });
    }

    static async deleteJob(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const job = await Job.findOne({ jobId: id });

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            if (job.userId !== userId) {
                return res.status(403).json({ error: 'Forbidden: You do not own this job' });
            }

            await Job.deleteOne({ jobId: id });

            const { Message } = await import('../models/Message');
            await Message.deleteMany({ jobId: id });

            res.json({ message: 'Job deleted successfully' });
        } catch (error) {
            console.error('Failed to delete job:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
