import { cn } from "@/lib/utils";

interface LoaderProps {
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function Loader({ size = "md", text, fullScreen = false, className }: LoaderProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24"
    };

    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg"
    };

    const loaderContent = (
        <div className={cn(
            "flex flex-col items-center justify-center gap-4",
            className
        )}>
            <div className="relative">
                {/* Outer rotating circle */}
                <div className={cn(
                    "border-2 border-primary/30 border-t-primary rounded-full animate-spin",
                    sizeClasses[size]
                )} />

                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
            </div>

            {text && (
                <p className={cn(
                    "text-muted-foreground font-mono tracking-wide animate-pulse",
                    textSizeClasses[size]
                )}>
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}
