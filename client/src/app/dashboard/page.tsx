"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Search } from "lucide-react";
import api from "@/lib/api";
import { JobStatus } from "@/types";

export default function Dashboard() {
    const [jobs, setJobs] = useState<JobStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { getToken } = useAuth();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = await getToken();

                const response = await api.get('/jobs', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setJobs(response.data || []);
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [getToken]);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
            <header className="flex items-center justify-between mb-8 border-b border-border pb-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/")}
                        className="rounded-none hover:bg-accent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight">RESEARCH_ARCHIVE</h1>
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground font-mono animate-pulse">
                        LOADING_ARCHIVES...
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="col-span-full text-center py-12 border border-dashed border-border rounded-sm bg-secondary/20">
                        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No research jobs found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            Start your first research task to see it appear in your archives.
                        </p>
                        <Button onClick={() => router.push("/")} variant="premium">
                            Start New Research
                        </Button>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <Card
                            key={job.jobId}
                            className="cursor-pointer hover:border-primary/50 transition-all group hover:shadow-md"
                            onClick={() => router.push(`/job/${job.jobId}`)}
                        >
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
                                            {job.query}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs">
                                            ID: {job.jobId.slice(0, 8)}
                                        </CardDescription>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${job.status === 'done' ? 'bg-green-500' :
                                            job.status === 'error' ? 'bg-red-500' :
                                                'bg-blue-500 animate-pulse'
                                        }`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <span className={`font-mono uppercase text-xs px-2 py-0.5 rounded-sm ${job.status === 'done' ? 'bg-green-500/10 text-green-500' :
                                            job.status === 'error' ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
