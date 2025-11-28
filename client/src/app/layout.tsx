import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "@/providers/react-query-provider";

export const metadata: Metadata = {
  title: "RAEGENT Research Agent",
  description: "RAEGENT Autonomous Research Agent - Deep dive into any topic with AI-driven analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#1e1e1e",
          colorText: "#ededed",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/30",
            GeistSans.variable,
            GeistMono.variable
          )}
        >
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
