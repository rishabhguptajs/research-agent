"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "@/lib/constants";
import { useSaveApiKey, useDeleteApiKey } from "@/hooks/useApiKeys";

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Provider = 'openrouter' | 'tavily';

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
    const [openRouterKey, setOpenRouterKey] = useState("");
    const [tavilyKey, setTavilyKey] = useState("");
    const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
    const [hasTavilyKey, setHasTavilyKey] = useState(false);
    const { getToken } = useAuth();

    const saveApiKeyMutation = useSaveApiKey();
    const deleteApiKeyMutation = useDeleteApiKey();

    const isLoading = saveApiKeyMutation.isPending || deleteApiKeyMutation.isPending;

    useEffect(() => {
        if (isOpen) {
            checkKeyStatus('openrouter');
            checkKeyStatus('tavily');
        }
    }, [isOpen]);

    const checkKeyStatus = async (provider: Provider) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE_URL}/user/key/${provider}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (provider === 'openrouter') {
                setHasOpenRouterKey(data.hasKey);
            } else {
                setHasTavilyKey(data.hasKey);
            }
        } catch (error) {
            console.error(`Failed to check ${provider} key status:`, error);
        }
    };

    const handleSave = async (provider: Provider) => {
        const key = provider === 'openrouter' ? openRouterKey : tavilyKey;
        if (!key) return;

        try {
            await saveApiKeyMutation.mutateAsync({ provider, apiKey: key });

            if (provider === 'openrouter') {
                setHasOpenRouterKey(true);
                setOpenRouterKey("");
            } else {
                setHasTavilyKey(true);
                setTavilyKey("");
            }

            alert(`${provider === 'openrouter' ? 'OpenRouter' : 'Tavily'} API Key saved successfully!`);
        } catch (error) {
            console.error(`Failed to save ${provider} key:`, error);
            alert("Failed to save key.");
        }
    };

    const handleDelete = async (provider: Provider) => {
        const providerName = provider === 'openrouter' ? 'OpenRouter' : 'Tavily';
        if (!confirm(`Are you sure you want to remove your ${providerName} API key?`)) return;

        try {
            await deleteApiKeyMutation.mutateAsync(provider);

            if (provider === 'openrouter') {
                setHasOpenRouterKey(false);
            } else {
                setHasTavilyKey(false);
            }

            alert(`${providerName} API Key removed.`);
        } catch (error) {
            console.error(`Failed to delete ${provider} key:`, error);
            alert("Failed to delete key.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>API Keys Configuration</DialogTitle>
                    <DialogDescription>
                        Configure your API keys for OpenRouter and Tavily. Both keys are required to use the research agent. Your keys are encrypted and stored securely.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-3 pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">OpenRouter API Key</h3>
                            {hasOpenRouterKey && (
                                <span className="text-xs text-green-500 font-medium">✓ Configured</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="openrouterKey" className="text-left sm:text-right text-sm">
                                API Key
                            </Label>
                            <Input
                                id="openrouterKey"
                                value={openRouterKey}
                                onChange={(e) => setOpenRouterKey(e.target.value)}
                                placeholder="sk-or-..."
                                className="col-span-1 sm:col-span-3"
                                type="password"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            {hasOpenRouterKey && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete('openrouter')}
                                    disabled={isLoading}
                                >
                                    Remove
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={() => handleSave('openrouter')}
                                disabled={isLoading || !openRouterKey}
                            >
                                {saveApiKeyMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Tavily API Key</h3>
                            {hasTavilyKey && (
                                <span className="text-xs text-green-500 font-medium">✓ Configured</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="tavilyKey" className="text-left sm:text-right text-sm">
                                API Key
                            </Label>
                            <Input
                                id="tavilyKey"
                                value={tavilyKey}
                                onChange={(e) => setTavilyKey(e.target.value)}
                                placeholder="tvly-..."
                                className="col-span-1 sm:col-span-3"
                                type="password"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            {hasTavilyKey && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete('tavily')}
                                    disabled={isLoading}
                                >
                                    Remove
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={() => handleSave('tavily')}
                                disabled={isLoading || !tavilyKey}
                            >
                                {saveApiKeyMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button variant="outline" onClick={onClose} className="cursor-pointer">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
