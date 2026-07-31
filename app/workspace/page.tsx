"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import PaperSearchPortal from "@/components/paper-search-portal";
import PaperUploader from "@/components/paper-uploader";
import SynthesisPortal from "@/components/synthesis-portal";
import Chat from "@/components/chat";
import ThemeToggle from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        router.push("/login");
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleTogglePaperSelection = (paperId: string) => {
    setSelectedPaperIds((prev) =>
      prev.includes(paperId)
        ? prev.filter((id) => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center space-y-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 bg-primary/15 rounded-full animate-ping" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full border border-gold/25">
            <span className="font-display text-gold text-xl">Ω</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium animate-amber-glow">
          Resuming research session...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <header className="border-b border-border bg-background/95 px-6 py-2 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-gold text-2xl leading-none">Ω</span>
          <h1 className="text-sm font-bold tracking-tight">
            <span className="text-primary font-display">Athena</span>{" "}
            <span className="text-muted-foreground font-medium">Research Engine</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center bg-card border border-border hover:border-primary/40 rounded-full py-1 pl-3.5 pr-3 gap-2.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-foreground font-semibold text-[11px]">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-popover border border-border text-popover-foreground rounded-xl shadow-xl mt-1 p-1">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2.5 py-1.5 tracking-wider">
                Account Details
              </DropdownMenuLabel>
              <div className="px-2.5 py-1 text-[10px] text-muted-foreground truncate">
                {user.email}
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg px-2.5 py-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-[40%] border-r border-border flex flex-col h-full overflow-y-auto p-6 space-y-6">
          <PaperUploader onUploadSuccess={handleUploadSuccess} />

          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Library Catalog
              </h3>
              <SynthesisPortal selectedPaperIds={selectedPaperIds} />
            </div>

            <PaperSearchPortal
              selectedPaperIds={selectedPaperIds}
              onTogglePaperSelection={handleTogglePaperSelection}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

        <div className="w-full md:w-[60%] flex flex-col h-full bg-background/60 relative">
          <Chat selectedPaperIds={selectedPaperIds} />
        </div>
      </div>
    </main>
  );
}
