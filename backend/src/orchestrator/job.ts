import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { JobStatus, MessageStatus } from '../types';
import { runPlanner } from '../controllers/plan';
import { runSearcher } from '../controllers/search';
import { runExtractor } from '../controllers/extract';
import { runCompiler } from '../controllers/compile';
import { dropCollection } from '../services/qdrant';
import { Job } from '../models/Job';
import { Message } from '../models/Message';
import { isDBConnected } from '../services/db';
import { User } from '../models/User';
import { decrypt } from '../services/crypto';

export const jobEmitter = new EventEmitter();

const activeMessages: Record<string, MessageStatus> = {};

export async function createJob(query: string, userId: string, type: 'research' | 'chat' = 'research'): Promise<string> {
    const jobId = uuidv4();
    const userMessageId = uuidv4();
    const assistantMessageId = uuidv4();
    const timestamp = Date.now();

    if (isDBConnected()) {
        try {
            await Job.create({
                jobId,
                userId,
                title: query, 
                createdAt: timestamp,
                updatedAt: timestamp,
                status: 'active'
            });
        } catch (error) {
            console.error('Failed to persist job to MongoDB:', error);
        }
    }

    const userMessage: MessageStatus = {
        messageId: userMessageId,
        jobId,
        role: 'user',
        content: query,
        type,
        status: 'done',
        data: {},
        createdAt: timestamp
    };

    activeMessages[userMessageId] = userMessage;

    const assistantMessage: MessageStatus = {
        messageId: assistantMessageId,
        jobId,
        role: 'assistant',
        content: '',
        type,
        status: 'planning',
        data: {},
        createdAt: timestamp + 1
    };

    activeMessages[assistantMessageId] = assistantMessage;

    if (isDBConnected()) {
        try {
            await Message.create({
                messageId: userMessageId,
                jobId,
                role: 'user',
                content: query,
                type,
                status: 'done',
                data: {},
                createdAt: timestamp,
                updatedAt: timestamp
            });

            await Message.create({
                messageId: assistantMessageId,
                jobId,
                role: 'assistant',
                content: '',
                type,
                status: 'planning',
                data: {},
                createdAt: timestamp + 1,
                updatedAt: timestamp + 1
            });
        } catch (error) {
            console.error('Failed to persist messages to MongoDB:', error);
        }
    }

    processMessage(jobId, assistantMessageId, query, type).catch(err => {
        console.error(`Unhandled error in message ${assistantMessageId}:`, err);
        updateMessageStatus(assistantMessageId, 'error', { error: err.message || String(err) });
    });

    return jobId;
}

export async function addMessage(jobId: string, content: string, type: 'research' | 'chat' = 'research'): Promise<string> {
    const userMessageId = uuidv4();
    const assistantMessageId = uuidv4();
    const timestamp = Date.now();

    const userMessage: MessageStatus = {
        messageId: userMessageId,
        jobId,
        role: 'user',
        content,
        type,
        status: 'done',
        data: {},
        createdAt: timestamp
    };

    activeMessages[userMessageId] = userMessage;

    const assistantMessage: MessageStatus = {
        messageId: assistantMessageId,
        jobId,
        role: 'assistant',
        content: '',
        type,
        status: 'planning',
        data: {},
        createdAt: timestamp + 1
    };

    activeMessages[assistantMessageId] = assistantMessage;

    if (isDBConnected()) {
        try {
            await Message.create({
                messageId: userMessageId,
                jobId,
                role: 'user',
                content,
                type,
                status: 'done',
                data: {},
                createdAt: timestamp,
                updatedAt: timestamp
            });

            await Message.create({
                messageId: assistantMessageId,
                jobId,
                role: 'assistant',
                content: '',
                type,
                status: 'planning',
                data: {},
                createdAt: timestamp + 1,
                updatedAt: timestamp + 1
            });

            await Job.updateOne({ jobId }, { updatedAt: timestamp });

        } catch (error) {
            console.error('Failed to persist messages to MongoDB:', error);
        }
    }

    processMessage(jobId, assistantMessageId, content, type).catch(err => {
        console.error(`Unhandled error in message ${assistantMessageId}:`, err);
        updateMessageStatus(assistantMessageId, 'error', { error: err.message || String(err) });
    });

    return assistantMessageId;
}

export async function getJob(id: string): Promise<{ job: JobStatus, messages: MessageStatus[] } | null> {
    if (isDBConnected()) {
        try {
            const job = await Job.findOne({ jobId: id }).lean();
            if (!job) return null;

            const messages = await Message.find({ jobId: id }).sort({ createdAt: 1 }).lean();

            const mergedMessages: any[] = messages.map(msg => {
                if (activeMessages[msg.messageId]) {
                    return { ...msg, ...activeMessages[msg.messageId] };
                }
                return msg;
            });

            Object.values(activeMessages).forEach(activeMsg => {
                if (activeMsg.jobId === id && !mergedMessages.find(m => m.messageId === activeMsg.messageId)) {
                    mergedMessages.push(activeMsg);
                }
            });

            mergedMessages.sort((a, b) => a.createdAt - b.createdAt);

            return {
                job: {
                    jobId: job.jobId,
                    userId: job.userId,
                    title: job.title,
                    createdAt: job.createdAt,
                    status: job.status as 'active' | 'done' | 'error'
                },
                messages: mergedMessages.map(msg => ({
                    messageId: msg.messageId,
                    jobId: msg.jobId,
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    type: msg.type as 'research' | 'chat',
                    status: msg.status as any,
                    data: msg.data || {},
                    createdAt: msg.createdAt
                } as MessageStatus))
            };
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
                title: job.title,
                createdAt: job.createdAt,
                status: job.status as 'active' | 'done' | 'error'
            }));
        } catch (error) {
            console.error('Failed to fetch jobs from MongoDB:', error);
        }
    }
    return [];
}

async function updateMessageStatus(messageId: string, status: MessageStatus['status'], dataUpdate?: Partial<MessageStatus['data']>) {
    const message = activeMessages[messageId];
    if (!message) return;

    message.status = status;
    if (dataUpdate) {
        message.data = { ...message.data, ...dataUpdate };
    }

    if (isDBConnected()) {
        try {
            await Message.updateOne(
                { messageId },
                {
                    $set: {
                        status,
                        data: message.data,
                        updatedAt: Date.now()
                    }
                }
            );
        } catch (error) {
            console.error('Failed to update message in MongoDB:', error);
        }
    }
}

async function processMessage(jobId: string, messageId: string, query: string, type: 'research' | 'chat') {
    const message = activeMessages[messageId];
    if (!message) return;

    try {
        const job = await Job.findOne({ jobId }).lean();
        if (!job) throw new Error('Job not found');

        const user = await User.findOne({ userId: job.userId });
        if (!user || !user.encryptedOpenRouterKey) {
            throw new Error('MISSING_API_KEY: You must provide an OpenRouter API key in Settings to use this tool.');
        }

        if (!user.encryptedTavilyKey) {
            throw new Error('MISSING_API_KEY: You must provide a Tavily API key in Settings to use this tool.');
        }

        const openRouterApiKey = decrypt(user.encryptedOpenRouterKey);
        const tavilyApiKey = decrypt(user.encryptedTavilyKey);

        if (type === 'chat') {
            console.log(`[Message ${messageId}] Starting Chat...`);
            await updateMessageStatus(messageId, 'compiling');
            jobEmitter.emit('update', { jobId, messageId, status: 'compiling', step: 'start' });

            const jobData = await getJob(jobId);
            const previousMessages = jobData?.messages.filter(m => m.messageId !== messageId) || [];

            const context = previousMessages.map(msg => {
                let text = `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
                if (msg.role === 'assistant' && msg.data?.final?.detailed) {
                    text += `(Detailed Report: ${msg.data.final.detailed})\n`;
                }
                return text;
            }).join('\n---\n');

            const prompt = `You are a helpful research assistant.
            
Previous conversation context:
${context}

Current User Question: ${query}

Please answer the user's question based on the context and your general knowledge. Keep it concise and helpful.`;

            const { streamComplete } = await import('../services/llm');
            let accumulatedResponse = '';

            for await (const chunk of streamComplete({
                prompt,
                apiKey: openRouterApiKey
            })) {
                accumulatedResponse += chunk;
                jobEmitter.emit('update', {
                    jobId,
                    messageId,
                    status: 'compiling',
                    type: 'stream',
                    chunk
                });
            }

            const finalResult = {
                summary: '',
                detailed: accumulatedResponse,
                citations: []
            };

            message.data.final = finalResult;
            await updateMessageStatus(messageId, 'done', { final: finalResult });
            jobEmitter.emit('update', { jobId, messageId, status: 'done', step: 'complete', data: message.data });

            setTimeout(() => {
                delete activeMessages[messageId];
            }, 60000);
            return;
        }

        console.log(`[Message ${messageId}] Starting Planning...`);
        await updateMessageStatus(messageId, 'planning');
        jobEmitter.emit('update', { jobId, messageId, status: 'planning', step: 'start' });

        const plan = await runPlanner(query, openRouterApiKey);
        message.data.plan = plan;
        await updateMessageStatus(messageId, 'planning', { plan });
        jobEmitter.emit('update', { jobId, messageId, status: 'planning', step: 'complete', data: plan });

        console.log(`[Message ${messageId}] Starting Search...`);
        await updateMessageStatus(messageId, 'searching');
        jobEmitter.emit('update', { jobId, messageId, status: 'searching', step: 'start' });

        const searchResult = await runSearcher(messageId, plan.search_queries, tavilyApiKey);
        message.data.search = searchResult;
        await updateMessageStatus(messageId, 'searching', { search: searchResult });
        jobEmitter.emit('update', { jobId, messageId, status: 'searching', step: 'complete', data: searchResult });

        console.log(`[Message ${messageId}] Starting Extraction...`);
        await updateMessageStatus(messageId, 'extracting');
        jobEmitter.emit('update', { jobId, messageId, status: 'extracting', step: 'start' });

        const extractionResult = await runExtractor(plan.sub_questions, searchResult.collectionName, openRouterApiKey);
        message.data.extraction = extractionResult;
        await updateMessageStatus(messageId, 'extracting', { extraction: extractionResult });
        jobEmitter.emit('update', { jobId, messageId, status: 'extracting', step: 'complete', data: extractionResult });

        console.log(`[Message ${messageId}] Starting Compilation...`);
        await updateMessageStatus(messageId, 'compiling');
        jobEmitter.emit('update', { jobId, messageId, status: 'compiling', step: 'start' });

        const { runCompilerStreaming } = await import('../controllers/compile');
        const finalResult = await runCompilerStreaming(extractionResult, openRouterApiKey, (chunk: string) => {
            jobEmitter.emit('update', {
                jobId,
                messageId,
                status: 'compiling',
                type: 'stream',
                chunk
            });
        });
        message.data.final = finalResult;

        await updateMessageStatus(messageId, 'compiling', { final: finalResult });
        jobEmitter.emit('update', { jobId, messageId, status: 'compiling', step: 'complete', data: finalResult });

        console.log(`[Message ${messageId}] Done.`);
        await updateMessageStatus(messageId, 'done');
        jobEmitter.emit('update', { jobId, messageId, status: 'done', step: 'complete', data: message.data });

        await dropCollection(searchResult.collectionName);

        setTimeout(() => {
            delete activeMessages[messageId];
        }, 60000);
    } catch (error: any) {
        console.error(`[Message ${messageId}] Failed:`, error);
        const errorMessage = error.message || String(error);
        await updateMessageStatus(messageId, 'error', { error: errorMessage });
        jobEmitter.emit('update', { jobId, messageId, status: 'error', error: errorMessage });
    }
}