import { useState, useEffect } from "react";
import ConfirmationModal from "./confirmation-modal";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  publishedYear: number;
  score?: number;
  snippets?: string[];
}

interface PaperSearchPortalProps {
  selectedPaperIds: string[];
  onTogglePaperSelection: (paperId: string) => void;
  refreshTrigger?: number;
}

export default function PaperSearchPortal({
  selectedPaperIds,
  onTogglePaperSelection,
  refreshTrigger = 0,
}: PaperSearchPortalProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"semantic" | "lexical">("semantic");
  const [yearStart, setYearStart] = useState<number>(2015);
  const [yearEnd, setYearEnd] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [deletePaperId, setDeletePaperId] = useState<string | null>(null);

  const fetchPapers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        query,
        mode,
        yearStart: yearStart.toString(),
        yearEnd: yearEnd.toString(),
      });
      const res = await fetch(`/api/papers/search?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw {
          message: errData.error || "Search failed",
          isExpected: true,
          status: res.status,
        };
      }
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Search warning (${err.status}): ${err.message}`);
      } else {
        console.error("Search failed:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [mode, yearStart, yearEnd, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPapers();
  };

  const initiateDelete = (paperId: string) => {
    setDeletePaperId(paperId);
  };

  const confirmDelete = async () => {
    if (!deletePaperId) return;
    const paperId = deletePaperId;
    setDeletePaperId(null);
    const toastId = toast.loading("Deleting research paper...");

    try {
      const res = await fetch(`/api/papers/search?id=${paperId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw {
          message: errData.error || "Deletion failed",
          isExpected: true,
          status: res.status,
        };
      }
      fetchPapers();
      if (selectedPaperIds.includes(paperId)) {
        onTogglePaperSelection(paperId);
      }
      toast.success("Research paper and vector index deleted successfully.", { id: toastId });
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Delete warning (${err.status}): ${err.message}`);
      } else {
        console.error("Delete failed:", err);
      }
      toast.error(err.message || "Failed to delete paper.", { id: toastId });
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers by title, author, or topic..."
            className="flex-1 px-3.5 py-2.5 bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 text-foreground placeholder:text-muted-foreground/50 text-xs transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setMode("semantic");
              setYearStart(2015);
              setYearEnd(new Date().getFullYear());
              setTimeout(() => fetchPapers(), 50);
            }}
            className="px-3 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 border border-border rounded-lg px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Mode</span>
            <div className="flex p-0.5 bg-muted/50 rounded-md border border-border">
              <button
                type="button"
                onClick={() => setMode("semantic")}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  mode === "semantic"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semantic
              </button>
              <button
                type="button"
                onClick={() => setMode("lexical")}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  mode === "lexical"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Keyword
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Year</span>
            <select
              value={yearStart}
              onChange={(e) => setYearStart(Number(e.target.value))}
              className="bg-muted/40 border border-border rounded-md px-2 py-1 text-foreground text-[10px] focus:outline-none"
            >
              {Array.from({ length: 13 }, (_, i) => 2015 + i).map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground/50 text-[10px]">&ndash;</span>
            <select
              value={yearEnd}
              onChange={(e) => setYearEnd(Number(e.target.value))}
              className="bg-muted/40 border border-border rounded-md px-2 py-1 text-foreground text-[10px] focus:outline-none"
            >
              {Array.from({ length: 13 }, (_, i) => 2015 + i).map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <svg className="animate-spin h-5 w-5 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-muted-foreground">Searching corpus...</span>
        </div>
      ) : papers.length === 0 ? (
        <div className="border border-border bg-muted/10 rounded-xl p-10 text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-muted/30 mx-auto flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M16 2v4" />
              <path d="M12 2v4" />
              <path d="M8 2v4" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-foreground">No papers found</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Adjust your search or upload a paper to start querying.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {papers.map((paper) => {
            const isSelected = selectedPaperIds.includes(paper.id);
            return (
              <div
                key={paper.id}
                className={`bg-card border rounded-xl p-4 hover:bg-muted/10 transition-all flex flex-col justify-between gap-3 ${
                  isSelected ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider block">
                        {paper.publishedYear} &middot; {paper.authors}
                      </span>
                      <h4 className="text-sm font-semibold text-foreground leading-snug">{paper.title}</h4>
                    </div>
                    {paper.score !== undefined && (
                      <span className="shrink-0 text-[9px] px-2 py-0.5 rounded-full font-medium border bg-primary/10 border-primary/20 text-primary uppercase tracking-wide">
                        {Math.round(paper.score * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    &ldquo;{paper.abstract}&rdquo;
                  </p>

                  {paper.snippets && paper.snippets.length > 0 && (
                    <div className="bg-muted/30 border border-border rounded-lg p-2.5 text-[10px] text-muted-foreground/80 leading-relaxed font-mono">
                      <span className="text-[8px] text-primary font-medium uppercase tracking-wider block mb-0.5">Match</span>
                      &ldquo;{paper.snippets[0]}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border mt-0.5">
                  <button
                    onClick={() => onTogglePaperSelection(paper.id)}
                    className={`text-[10px] px-3 py-1.5 rounded-md font-medium transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "bg-muted/30 border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Selected
                      </>
                    ) : (
                      "Select for Chat"
                    )}
                  </button>

                  <button
                    onClick={() => initiateDelete(paper.id)}
                    className="text-[10px] text-muted-foreground hover:text-destructive px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationModal
        isOpen={deletePaperId !== null}
        title="Delete Research Paper"
        message="Are you sure you want to delete this research paper and its vector embeddings from the index? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletePaperId(null)}
      />
    </div>
  );
}
