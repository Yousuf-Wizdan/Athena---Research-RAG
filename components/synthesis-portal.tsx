import { useState } from "react";
import { toast } from "sonner";

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
      return <pre className="text-xs text-[#9F907E] font-mono whitespace-pre-wrap">{md}</pre>;
    }

    const parseRow = (line: string) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());

    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(1).map(parseRow);

    return (
      <div className="overflow-x-auto border border-[#36302A] rounded-xl bg-[#141210]/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#36302A] bg-[#1E1B18]">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold text-[#E6DCC3] tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#36302A]/50">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#D4783C]/[0.02] transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3 text-[#9F907E] leading-relaxed ${
                      cIdx === 0 ? "font-semibold text-[#E6DCC3]" : ""
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
        className={`w-full py-2 bg-[#D4783C]/10 border border-[#D4783C]/30 text-[#D4783C] text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
          !disabled ? "hover:bg-[#D4783C]/15 hover:border-[#D4783C]/50 shadow-sm shadow-[#D4783C]/10 active:scale-[0.98]" : ""
        }`}
        title={disabled ? "Select 2 or more papers to generate a synthesis matrix" : "Compare selected papers"}
      >
        <span>Compare & Synthesize ({selectedPaperIds.length}/2+ Selected)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[#141210]/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-5xl bg-[#1A1714] border border-[#36302A] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[#36302A] bg-[#141210]/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#E6DCC3] flex items-center gap-2">
                <span className="font-display text-[#B8943C]">Ω</span>
                <span>Literature Synthesis Matrix</span>
                <span className="text-[10px] text-[#D4783C] font-medium px-2 py-0.5 bg-[#D4783C]/10 rounded-full border border-[#D4783C]/25">
                  AI Synthesized
                </span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-[#9F907E] hover:text-[#E6DCC3] font-bold px-2 py-1 rounded-lg hover:bg-[#D4783C]/5 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#141210]/40">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-[#D4783C]/15 rounded-full animate-ping"></div>
                    <div className="relative flex items-center justify-center w-12 h-12 bg-[#D4783C]/10 rounded-full border border-[#D4783C]/25">
                      <svg className="animate-spin h-5 w-5 text-[#D4783C]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <span className="text-xs font-semibold text-[#E6DCC3] block">Synthesizing Comparative Matrix</span>
                    <span className="text-[10px] text-[#9F907E] block animate-amber-glow">{loadingStep}</span>
                  </div>
                </div>
              ) : error ? (
                <div className="py-12 text-center space-y-4">
                  <div className="bg-[#B84747]/10 border border-[#B84747]/20 text-[#B84747] rounded-xl p-4 text-xs max-w-md mx-auto">
                    {error}
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-[#1E1B18] hover:bg-[#282420] text-[#9F907E] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Retry Generation
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="text-[10px] text-[#9F907E] leading-relaxed max-w-3xl">
                    Below is the comparative matrix synthesizing core objectives, datasets, methods, findings, and limitations from the selected documents.
                  </div>
                  {renderTable(matrix)}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-[#36302A] bg-[#141210]/40 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-[#1E1B18] border border-[#36302A] hover:bg-[#282420] text-[#9F907E] text-xs font-medium rounded-xl transition-all cursor-pointer"
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
