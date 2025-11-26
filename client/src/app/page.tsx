import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import ResearchForm from "@/components/research/ResearchForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Header / Nav */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary"></div>
          <span className="font-mono font-bold tracking-tighter text-lg">RESEARCH_AGENT_V1</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button className="rounded-none hover:bg-accent cursor-pointer">
                DASHBOARD
            </Button>
          </Link>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-none border border-border"
                }
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                ACCESS_TERMINAL
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      {/* Hero Section */}
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            AUTONOMOUS
            <br />
            RESEARCH ENGINE
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light">
            Deep dive into any topic with AI-driven analysis.
            <br />
            Plan. Search. Extract. Compile.
          </p>
        </div>

        <div className="w-full mt-8">
          <ResearchForm />
        </div>
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/50 backdrop-blur-sm flex justify-between items-center text-[10px] text-muted-foreground font-mono uppercase">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            SYSTEM_ONLINE
          </span>
          <span>LATENCY: 12ms</span>
        </div>
        <div>
          © 2025 RESEARCH_CORP
        </div>
      </div>
    </main>
  );
}
