import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { JobStatus } from "@/types";
import { useRouter } from "next/navigation";

export function JobCard({ job }: { job: JobStatus }) {
    const router = useRouter();

    return (
        <Card
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
    );
}
