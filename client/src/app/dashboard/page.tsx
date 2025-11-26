"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Search, User, Key, Mail, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import ApiKeyModal from "@/components/ApiKeyModal";
import { useDashboard } from "@/hooks/useDashboard";
import { JobCard } from "@/components/dashboard/JobCard";

export default function Dashboard() {
    const {
        jobs,
        isLoading,
        isSettingsOpen,
        setIsSettingsOpen,
        isSignedIn,
        isLoaded
    } = useDashboard();

    const router = useRouter();
    const { user } = useUser();

    const completedJobs = jobs.filter(j => j.status === 'done').length;
    const activeJobs = jobs.filter(j => j.status !== 'done' && j.status !== 'error').length;
    const failedJobs = jobs.filter(j => j.status === 'error').length;

    // Show loading screen while checking auth
    if (!isLoaded || (isLoaded && !isSignedIn)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-none animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground font-mono">VERIFYING_ACCESS...</p>
                </div>
            </div>
        );
    }

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

            <div className="grid gap-6 md:grid-cols-4 mb-8">
                {/* User Profile Card */}
                <Card className="col-span-full md:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="w-5 h-5" />
                            User Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{user?.primaryEmailAddress?.emailAddress || "No email"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                            ID: {user?.id}
                        </div>
                        <Button
                            variant="outline"
                            className="w-full gap-2 text-sm"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            <Key className="w-4 h-4" />
                            Manage API Key
                        </Button>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            <span className="text-3xl font-bold text-green-500">{completedJobs}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs">In Progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-500" />
                            <span className="text-3xl font-bold text-blue-500">{activeJobs}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Failed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-red-500" />
                            <span className="text-3xl font-bold text-red-500">{failedJobs}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Research
            </h2>

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
                        <JobCard key={job.jobId} job={job} />
                    ))
                )}
            </div>

            <ApiKeyModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
