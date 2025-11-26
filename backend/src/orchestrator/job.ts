import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { JobStatus } from '../types';
import { runPlanner } from '../controllers/plan';
import { runSearcher } from '../controllers/search';
import { runExtractor } from '../controllers/extract';
import { runCompiler } from '../controllers/compile';
import { dropCollection } from '../services/qdrant';
import { Job, IJob } from '../models/Job';
import { isDBConnected } from '../services/db';
import { User } from '../models/User';
import { decrypt } from '../services/crypto';

export const jobEmitter = new EventEmitter();

// In-memory cache for active jobs (for quick access during processing)
const activeJobs: Record<string, JobStatus> = {};

export async function createJob(query: string, userId: string): Promise<string> {
    const jobId = uuidv4();
    const timestamp = Date.now();

    const jobData: JobStatus = {
        jobId,
        userId,
        query,
        createdAt: timestamp,
        status: 'planning',
        data: {}
    };

    activeJobs[jobId] = jobData;

    if (isDBConnected()) {
        try {
            await Job.create({
                jobId,
                userId,
                query,
                createdAt: timestamp,
                updatedAt: timestamp,
                status: 'planning',
                data: {}
            });
        } catch (error) {
            console.error('Failed to persist job to MongoDB:', error);
        }
    }

    processJob(jobId, query).catch(err => {
        console.error(`Unhandled error in job ${jobId}:`, err);
        updateJobStatus(jobId, 'error', { error: err.message || String(err) });
    });

    return jobId;
}

export async function getJob(id: string): Promise<JobStatus | null> {
    if (activeJobs[id]) {
        return activeJobs[id];
    }
    if (isDBConnected()) {
        try {
            const job = await Job.findOne({ jobId: id }).lean();
            if (job) {
                return {
                    jobId: job.jobId,
                    userId: job.userId,
                    query: job.query,
                    createdAt: job.createdAt,
                    status: job.status,
                    data: job.data || {}
                };
            }
        } catch (error) {
            console.error('Failed to fetch job from MongoDB:', error);
        }
    }

    return null;
}

export async function getJobs(userId: string): Promise<JobStatus[]> {
    if (isDBConnected()) {
        try {
            const jobs = await Job.find({ userId })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();

            return jobs.map(job => ({
                jobId: job.jobId,
                userId: job.userId,
                query: job.query,
                createdAt: job.createdAt,
                status: job.status,
                data: job.data || {}
            }));
        } catch (error) {
            console.error('Failed to fetch jobs from MongoDB:', error);
        }
    }

    return Object.values(activeJobs).filter(job => job.userId === userId);
}

async function updateJobStatus(jobId: string, status: JobStatus['status'], dataUpdate?: Partial<JobStatus['data']>) {
    const job = activeJobs[jobId];
    if (!job) return;

    job.status = status;
    if (dataUpdate) {
        job.data = { ...job.data, ...dataUpdate };
    }

    if (isDBConnected()) {
        try {
            await Job.updateOne(
                { jobId },
                {
                    $set: {
                        status,
                        data: job.data,
                        updatedAt: Date.now()
                    }
                }
            );
        } catch (error) {
            console.error('Failed to update job in MongoDB:', error);
        }
    }
}

async function processJob(jobId: string, query: string) {
    const job = activeJobs[jobId];
    if (!job) return;

    try {
        const user = await User.findOne({ userId: job.userId });
        if (!user || !user.encryptedOpenRouterKey) {
            throw new Error('MISSING_API_KEY: You must provide an OpenRouter API key in Settings to use this tool.');
        }

        if (!user.encryptedTavilyKey) {
            throw new Error('MISSING_API_KEY: You must provide a Tavily API key in Settings to use this tool.');
        }

        const openRouterApiKey = decrypt(user.encryptedOpenRouterKey);
        const tavilyApiKey = decrypt(user.encryptedTavilyKey);

        console.log(`[Job ${jobId}] Starting Planning...`);
        await updateJobStatus(jobId, 'planning');
        jobEmitter.emit('update', { jobId, status: 'planning', step: 'start' });

        const plan = await runPlanner(query, openRouterApiKey);
        job.data.plan = plan;
        await updateJobStatus(jobId, 'planning', { plan });
        jobEmitter.emit('update', { jobId, status: 'planning', step: 'complete', data: plan });

        console.log(`[Job ${jobId}] Starting Search...`);
        await updateJobStatus(jobId, 'searching');
        jobEmitter.emit('update', { jobId, status: 'searching', step: 'start' });

        const searchResult = await runSearcher(jobId, plan.search_queries, tavilyApiKey);
        job.data.search = searchResult;
        await updateJobStatus(jobId, 'searching', { search: searchResult });
        jobEmitter.emit('update', { jobId, status: 'searching', step: 'complete', data: searchResult });

        console.log(`[Job ${jobId}] Starting Extraction...`);
        await updateJobStatus(jobId, 'extracting');
        jobEmitter.emit('update', { jobId, status: 'extracting', step: 'start' });

        const extractionResult = await runExtractor(plan.sub_questions, searchResult.collectionName, openRouterApiKey);
        job.data.extraction = extractionResult;
        await updateJobStatus(jobId, 'extracting', { extraction: extractionResult });
        jobEmitter.emit('update', { jobId, status: 'extracting', step: 'complete', data: extractionResult });

        console.log(`[Job ${jobId}] Starting Compilation...`);
        await updateJobStatus(jobId, 'compiling');
        jobEmitter.emit('update', { jobId, status: 'compiling', step: 'start' });

        const finalResult = await runCompiler(extractionResult, openRouterApiKey);
        job.data.final = finalResult;
        console.log('[Job] Final result stored:', {
            jobId,
            hasFinal: !!job.data.final,
            hasSummary: !!job.data.final?.summary,
            citationsCount: job.data.final?.citations?.length || 0
        });
        await updateJobStatus(jobId, 'compiling', { final: finalResult });
        jobEmitter.emit('update', { jobId, status: 'compiling', step: 'complete', data: finalResult });

        console.log(`[Job ${jobId}] Done.`);
        await updateJobStatus(jobId, 'done');
        jobEmitter.emit('update', { jobId, status: 'done', step: 'complete', data: job.data });

        await dropCollection(searchResult.collectionName);

        setTimeout(() => {
            delete activeJobs[jobId];
        }, 60000);
    } catch (error: any) {
        console.error(`[Job ${jobId}] Failed:`, error);
        await updateJobStatus(jobId, 'error', { error: error.message || String(error) });
        jobEmitter.emit('update', { jobId, status: 'error', error: job.data.error });
    }
}
