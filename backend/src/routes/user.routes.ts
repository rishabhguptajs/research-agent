import { Router } from 'express';
import { User } from '../models/User';
import { encrypt, decrypt } from '../services/crypto';

const router = Router();

type ApiProvider = 'openrouter' | 'tavily';

const PROVIDER_FIELD_MAP: Record<ApiProvider, keyof Pick<any, 'encryptedOpenRouterKey' | 'encryptedTavilyKey'>> = {
    openrouter: 'encryptedOpenRouterKey',
    tavily: 'encryptedTavilyKey'
};

function validateProvider(provider: string): provider is ApiProvider {
    return provider === 'openrouter' || provider === 'tavily';
}

// GET /user/key/:provider - Check if user has API key for provider
router.get('/key/:provider', async (req, res) => {
    const userId = (req as any).auth.userId;
    const { provider } = req.params;

    if (!validateProvider(provider)) {
        return res.status(400).json({ error: 'Invalid provider. Must be "openrouter" or "tavily"' });
    }

    try {
        const user = await User.findOne({ userId });
        const field = PROVIDER_FIELD_MAP[provider];
        res.json({ hasKey: !!user?.[field] });
    } catch (error) {
        console.error(`Error fetching ${provider} key status:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /user/key/:provider - Save encrypted API key for provider
router.post('/key/:provider', async (req, res) => {
    const userId = (req as any).auth.userId;
    const { provider } = req.params;
    const { key } = req.body;

    if (!validateProvider(provider)) {
        return res.status(400).json({ error: 'Invalid provider. Must be "openrouter" or "tavily"' });
    }

    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        const encryptedKey = encrypt(key);
        const field = PROVIDER_FIELD_MAP[provider];

        await User.findOneAndUpdate(
            { userId },
            { userId, [field]: encryptedKey, updatedAt: Date.now() },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(`Error saving ${provider} key:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /user/key/:provider - Delete API key for provider
router.delete('/key/:provider', async (req, res) => {
    const userId = (req as any).auth.userId;
    const { provider } = req.params;

    if (!validateProvider(provider)) {
        return res.status(400).json({ error: 'Invalid provider. Must be "openrouter" or "tavily"' });
    }

    try {
        const field = PROVIDER_FIELD_MAP[provider];

        await User.findOneAndUpdate(
            { userId },
            { $unset: { [field]: "" }, updatedAt: Date.now() }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(`Error deleting ${provider} key:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
