const pdf = require('pdf-parse');

export async function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
        return buffer.toString('utf-8');
    } else {
        throw new Error('Unsupported file type');
    }
}
