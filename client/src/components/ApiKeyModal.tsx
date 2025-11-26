"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
    const [key, setKey] = useState("");
    const [hasKey, setHasKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    useEffect(() => {
        if (isOpen) {
            checkKeyStatus();
        }
    }, [isOpen]);

    const checkKeyStatus = async () => {
        try {
            const token = await getToken();
            const res = await fetch("http://localhost:3000/user/key", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setHasKey(data.hasKey);
        } catch (error) {
            console.error("Failed to check key status:", error);
        }
    };

    const handleSave = async () => {
        if (!key) return;
        setLoading(true);
        try {
            const token = await getToken();
            await fetch("http://localhost:3000/user/key", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ key }),
            });
            setHasKey(true);
            setKey("");
            alert("API Key saved successfully!");
            onClose();
        } catch (error) {
            console.error("Failed to save key:", error);
            alert("Failed to save key.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to remove your API key?")) return;
        setLoading(true);
        try {
            const token = await getToken();
            await fetch("http://localhost:3000/user/key", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setHasKey(false);
            alert("API Key removed.");
        } catch (error) {
            console.error("Failed to delete key:", error);
            alert("Failed to delete key.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>OpenRouter API Key</DialogTitle>
                    <DialogDescription>
                        Enter your OpenRouter API key to use the research agent. Your key is encrypted and stored securely.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                        <Label htmlFor="apiKey" className="text-left sm:text-right">
                            API Key
                        </Label>
                        <Input
                            id="apiKey"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="sk-or-..."
                            className="col-span-1 sm:col-span-3"
                            type="password"
                        />
                    </div>
                    {hasKey && (
                        <div className="text-sm text-green-500 font-medium text-center">
                            ✓ API Key is currently saved
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {hasKey && (
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            Remove Key
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={loading || !key}>
                        {loading ? "Saving..." : "Save Key"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
