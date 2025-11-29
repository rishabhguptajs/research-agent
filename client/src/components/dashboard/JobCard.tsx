import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock, Trash2 } from "lucide-react";
import { JobStatus } from "@/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function JobCard({ job, onDelete }: { job: JobStatus; onDelete: (jobId: string) => void }) {
    const router = useRouter();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(job.jobId);
    };

    return (
        <Card
            className="cursor-pointer hover:border-primary/50 transition-all group hover:shadow-md relative"
            onClick={() => router.push(`/job/${job.jobId}`)}
        >
            <CardHeader>
                <div className="flex items-start gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${job.status === 'done' ? 'bg-green-500' :
                        job.status === 'error' ? 'bg-red-500' :
                            'bg-blue-500 animate-pulse'
                        }`} />
                    <div className="flex-1 pr-8">
                        <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
                            {job.query}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                            ID: {job.jobId.slice(0, 8)}
                        </CardDescription>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDelete}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
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
