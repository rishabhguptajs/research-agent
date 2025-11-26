import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { JobState } from "@/hooks/useJobStream";

const STEPS = [
    { id: 'planning', label: 'Planning Research' },
    { id: 'searching', label: 'Searching Web' },
    { id: 'extracting', label: 'Extracting Facts' },
    { id: 'compiling', label: 'Compiling Report' },
];

export default function JobStatus({ job }: { job: JobState }) {
    const currentStepIndex = STEPS.findIndex(s => s.id === job.status);
    const isDone = job.status === 'done';
    const isError = job.status === 'error';

    return (
        <div className="w-full space-y-8">
            {/* Status Badge */}
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        isDone ? "bg-green-500" : isError ? "bg-red-500" : "bg-blue-500"
                    )}></div>
                    <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                        STATUS: <span className="text-foreground font-bold">{job.status}</span>
                    </span>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                    ID: {job.jobId.slice(0, 8)}
                </div>
            </div>

            {/* Stepper */}
            <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>
                <div className="space-y-8">
                    {STEPS.map((step, index) => {
                        const isActive = job.status === step.id;
                        const isCompleted = isDone || (currentStepIndex > index && !isError);
                        const isPending = !isActive && !isCompleted;

                        return (
                            <div key={step.id} className="relative flex items-start gap-4 group">
                                <div className={cn(
                                    "relative z-10 flex items-center justify-center w-6 h-6 rounded-full border bg-background transition-colors duration-300",
                                    isActive ? "border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                                        isCompleted ? "border-green-500 text-green-500 bg-green-500/10" :
                                            "border-muted text-muted-foreground"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : isActive ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Circle className="w-2 h-2 fill-current" />
                                    )}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <h3 className={cn(
                                        "font-mono text-sm font-medium transition-colors",
                                        isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </h3>

                                    {/* Step Details (Collapsible or visible when active) */}
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-2 text-xs text-muted-foreground font-mono bg-secondary/50 p-2 border border-border rounded-sm"
                                        >
                                            <span className="animate-pulse">Processing...</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Error Display */}
            {isError && (
                <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-sm flex items-start gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm">Execution Failed</h4>
                        <p className="text-xs font-mono">{job.data.error || "Unknown error occurred"}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
