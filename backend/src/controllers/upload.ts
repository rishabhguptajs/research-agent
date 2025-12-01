import { Request, Response } from 'express';
import { extractTextFromFile } from '../services/text-extractor';
import { chunkText } from '../services/chunk';
import { createCollection, upsertChunks } from '../services/qdrant';
import { DocumentModel } from '../models/Document';
import { v4 as uuidv4 } from 'uuid';

export async function uploadDocument(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = (req as any).auth.userId;
        const collectionName = `kb_${userId}`;

        console.log(`[Upload] Processing file ${req.file.originalname} for user ${userId}`);

        const text = await extractTextFromFile(req.file.buffer, req.file.mimetype);
        if (!text.trim()) {
            return res.status(400).json({ error: 'Extracted text is empty' });
        }

        const chunks = await chunkText(text, req.file.originalname);

        try {
            await createCollection(collectionName);
        } catch (e: any) {
            console.log(`[Upload] Collection might already exist: ${e.message}`);
        }

        await upsertChunks(collectionName, chunks.map(c => ({
            id: c.id,
            vector: c.embedding,
            payload: {
                text: c.text,
                source: c.source,
                userId
            }
        })));

        const documentId = uuidv4();
        const chunkIds = chunks.map(c => c.id);

        await DocumentModel.create({
            documentId,
            userId,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            collectionName,
            chunkIds,
            totalChunks: chunks.length,
            uploadedAt: Date.now()
        });

        console.log(`[Upload] Successfully ingested ${chunks.length} chunks and stored document metadata`);

        res.json({
            success: true,
            message: 'Document processed and stored successfully',
            documentId,
            chunks: chunks.length,
            chunkIds
        });

    } catch (error: any) {
        console.error('[Upload] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process document' });
    }
}
