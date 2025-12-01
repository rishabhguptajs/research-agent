import { Request, Response } from 'express';
import { DocumentModel } from '../models/Document';
import { Job } from '../models/Job';
import { searchSimilar } from '../services/qdrant';

export class DocumentsController {
    static async getUserDocuments(req: Request, res: Response) {
        const userId = (req as any).auth.userId;

        try {
            const documents = await DocumentModel.find({ userId })
                .sort({ uploadedAt: -1 })
                .select('documentId fileName fileSize totalChunks uploadedAt lastAccessedAt')
                .lean();

            res.json(documents);
        } catch (error: any) {
            console.error('[Documents] Error fetching user documents:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch documents' });
        }
    }

    static async getDocumentById(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const document = await DocumentModel.findOne({ documentId: id, userId }).lean();

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            await DocumentModel.updateOne(
                { documentId: id },
                { lastAccessedAt: Date.now() }
            );

            res.json(document);
        } catch (error: any) {
            console.error('[Documents] Error fetching document:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch document' });
        }
    }

    static async attachDocumentToJob(req: Request, res: Response) {
        const { id: documentId, jobId } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const job = await Job.findOne({ jobId, userId });
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const document = await DocumentModel.findOne({ documentId, userId });
            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            if (!job.attachedDocuments?.includes(documentId)) {
                await Job.updateOne(
                    { jobId },
                    {
                        $addToSet: { attachedDocuments: documentId },
                        updatedAt: Date.now()
                    }
                );
            }

            res.json({
                success: true,
                message: 'Document attached to job successfully'
            });
        } catch (error: any) {
            console.error('[Documents] Error attaching document to job:', error);
            res.status(500).json({ error: error.message || 'Failed to attach document' });
        }
    }

    static async detachDocumentFromJob(req: Request, res: Response) {
        const { id: documentId, jobId } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const job = await Job.findOne({ jobId, userId });
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            await Job.updateOne(
                { jobId },
                {
                    $pull: { attachedDocuments: documentId },
                    updatedAt: Date.now()
                }
            );

            res.json({
                success: true,
                message: 'Document detached from job successfully'
            });
        } catch (error: any) {
            console.error('[Documents] Error detaching document from job:', error);
            res.status(500).json({ error: error.message || 'Failed to detach document' });
        }
    }

    static async getJobAttachedDocuments(req: Request, res: Response) {
        const { jobId } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const job = await Job.findOne({ jobId, userId }).lean();
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            if (!job.attachedDocuments || job.attachedDocuments.length === 0) {
                return res.json([]);
            }

            const documents = await DocumentModel.find({
                documentId: { $in: job.attachedDocuments },
                userId
            })
            .select('documentId fileName fileSize totalChunks uploadedAt')
            .lean();

            res.json(documents);
        } catch (error: any) {
            console.error('[Documents] Error fetching job attached documents:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch attached documents' });
        }
    }

    static async getDocumentChunks(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const document = await DocumentModel.findOne({ documentId: id, userId }).lean();

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }

            res.json({
                documentId: document.documentId,
                chunkIds: document.chunkIds,
                totalChunks: document.totalChunks
            });
        } catch (error: any) {
            console.error('[Documents] Error fetching document chunks:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch document chunks' });
        }
    }

    static async deleteDocument(req: Request, res: Response) {
        const { id } = req.params;
        const userId = (req as any).auth.userId;

        try {
            const document = await DocumentModel.findOne({ documentId: id, userId });

            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }
            
            await Job.updateMany(
                { attachedDocuments: id },
                { $pull: { attachedDocuments: id } }
            );

            await DocumentModel.deleteOne({ documentId: id });

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        } catch (error: any) {
            console.error('[Documents] Error deleting document:', error);
            res.status(500).json({ error: error.message || 'Failed to delete document' });
        }
    }
}
