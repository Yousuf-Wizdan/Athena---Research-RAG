"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PaperSearchPortal from "@/components/paper-search-portal";
import PaperUploader from "@/components/paper-uploader";
import SynthesisPortal from "@/components/synthesis-portal";
import Chat from "@/components/chat";
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

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── 1. Authenticate user session on mount ──────────────────────────────────
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
      <div className="min-h-screen bg-[#141210] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 bg-[#D4783C]/15 rounded-full animate-ping"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-[#B8943C]/10 rounded-full border border-[#B8943C]/25">
            <span className="font-display text-[#B8943C] text-xl">Ω</span>
          </div>
        </div>
        <span className="text-xs text-[#9F907E] font-medium animate-amber-glow">
          Resuming research session...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="h-screen bg-[#141210] text-[#E6DCC3] flex flex-col font-sans overflow-hidden">
      {/* Page Header */}
      <header className="border-b border-[#36302A] bg-[#141210]/95 px-6 py-2 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-[#B8943C] text-2xl leading-none">Ω</span>
          <h1 className="text-sm font-bold tracking-tight">
            <span className="text-[#D4783C] font-display">Athena</span>{" "}
            <span className="text-[#9F907E] font-medium">Research Engine</span>
          </h1>
        </div>
        
        {/* User context & Logout actions in an interactive dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center bg-[#1E1B18] border border-[#36302A] hover:border-[#D4783C]/40 rounded-full py-1 pl-3.5 pr-3 gap-2.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4783C] animate-pulse"></span>
              <span className="text-[#E6DCC3] font-semibold text-[11px]">{user.name}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#9F907E]">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-[#1C1A17] border border-[#36302A] text-[#E6DCC3] rounded-xl shadow-xl mt-1 p-1">
            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[#9F907E] px-2.5 py-1.5 tracking-wider">
              Account Details
            </DropdownMenuLabel>
            <div className="px-2.5 py-1 text-[10px] text-[#9F907E] truncate">
              {user.email}
            </div>
            <DropdownMenuSeparator className="bg-[#36302A]" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 text-xs font-semibold text-[#B84747] hover:bg-[#B84747]/10 rounded-lg px-2.5 py-2 cursor-pointer transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Workspace Cockpit Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Search & Ingest */}
        <div className="w-full md:w-[40%] border-r border-[#36302A] flex flex-col h-full overflow-y-auto p-6 space-y-6">
          <PaperUploader onUploadSuccess={handleUploadSuccess} />
          
          <div className="border-t border-[#36302A]/50 pt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-[#E6DCC3] flex items-center gap-2">
                Library Catalog
              </h3>
              {/* Dynamic Synthesis Matrix Action */}
              <SynthesisPortal selectedPaperIds={selectedPaperIds} />
            </div>
            
            <PaperSearchPortal
              selectedPaperIds={selectedPaperIds}
              onTogglePaperSelection={handleTogglePaperSelection}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

        {/* Right Side: Chat Assistant */}
        <div className="w-full md:w-[60%] flex flex-col h-full bg-[#141210]/60 relative">
          <Chat selectedPaperIds={selectedPaperIds} />
        </div>
      </div>
    </main>
  );
}
