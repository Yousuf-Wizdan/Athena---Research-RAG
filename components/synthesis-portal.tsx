import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface SynthesisPortalProps {
  selectedPaperIds: string[];
}

export default function SynthesisPortal({ selectedPaperIds }: SynthesisPortalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [matrix, setMatrix] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState("");

  const steps = [
    "Reading selected abstracts...",
    "Aligning core research methodologies...",
    "Extracting key findings and datasets...",
    "Formulating comparative limitations...",
    "Structuring markdown matrix grid..."
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setMatrix("");
    setIsOpen(true);

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const toastId = toast.loading("Analyzing research literature...", {
      description: "Comparing selected research papers.",
    });

    const stepInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setLoadingStep(steps[stepIdx]);
      toast.loading(steps[stepIdx], { id: toastId });
    }, 1500);

    try {
      const res = await fetch("/api/papers/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperIds: selectedPaperIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw {
          message: data.error || "Generation failed.",
          isExpected: true,
          status: res.status,
        };
      }

      setMatrix(data.matrix);
      toast.success("Literature synthesis matrix completed!", { id: toastId });
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Synthesis warning (${err.status}): ${err.message}`);
      } else {
        console.error("Unexpected synthesis error:", err);
      }
      setError(err.message || "An error occurred while generating the synthesis.");
      toast.error(err.message || "Failed to generate synthesis matrix.", { id: toastId });
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const renderTable = (md: string) => {
    const lines = md.trim().split("\n");
    const tableLines = lines.filter(
      (line) => line.trim().startsWith("|") && !line.includes("---")
    );

    if (tableLines.length === 0) {
      return <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{md}</pre>;
    }

    const parseRow = (line: string) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());

    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(1).map(parseRow);

    return (
      <div className="overflow-x-auto border border-border rounded-xl bg-background/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-card">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold text-foreground tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-primary/[0.02] transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3 text-muted-foreground leading-relaxed ${
                      cIdx === 0 ? "font-semibold text-foreground" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const disabled = selectedPaperIds.length < 2;

  return (
    <div className="mt-0">
      <button
        onClick={handleGenerate}
        disabled={disabled}
        className={`w-full py-2 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
          !disabled ? "hover:bg-primary/15 hover:border-primary/50 shadow-sm shadow-primary/10 active:scale-[0.98]" : ""
        }`}
        title={disabled ? "Select 2 or more papers to generate a synthesis matrix" : "Compare selected papers"}
      >
        <span>Compare & Synthesize ({selectedPaperIds.length}/2+ Selected)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-5xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-border bg-background/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="font-display text-gold">Ω</span>
                <span>Literature Synthesis Matrix</span>
                <span className="text-[10px] text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full border border-primary/25">
                  AI Synthesized
                </span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-background/40">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/15 rounded-full animate-ping" />
                    <div className="relative flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full border border-primary/25">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Synthesizing Comparative Matrix</span>
                    <span className="text-[10px] text-muted-foreground block animate-amber-glow">{loadingStep}</span>
                  </div>
                </div>
              ) : error ? (
                <div className="py-12 text-center space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-xs max-w-md mx-auto">
                    {error}
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-card hover:bg-muted text-muted-foreground text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Retry Generation
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-[10px] text-muted-foreground leading-relaxed max-w-3xl">
                    Below is the comparative matrix synthesizing core objectives, datasets, methods, findings, and limitations from the selected documents.
                  </div>
                  {renderTable(matrix)}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-border bg-background/40 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-card border border-border hover:bg-muted text-muted-foreground text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
