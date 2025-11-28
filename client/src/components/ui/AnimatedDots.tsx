export function AnimatedDots() {
    return (
        <span className="inline-flex ml-1 gap-0.5">
            <span className="animate-[bounce_1.4s_ease-in-out_infinite]">.</span>
            <span className="animate-[bounce_1.4s_ease-in-out_0.2s_infinite]">.</span>
            <span className="animate-[bounce_1.4s_ease-in-out_0.4s_infinite]">.</span>
        </span>
    );
}
