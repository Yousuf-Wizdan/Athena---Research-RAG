import { useState, useRef } from "react";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  publishedYear: number;
  pdfUrl?: string | null;
}

interface PaperUploaderProps {
  onUploadSuccess?: (paper: Paper) => void;
}

export default function PaperUploader({ onUploadSuccess }: PaperUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [progressStep, setProgressStep] = useState("");
  const [ingestedPaper, setIngestedPaper] = useState<Paper | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");
    setProgressStep("Reading document and extracting text...");
    const toastId = toast.loading("Reading document and extracting text...");

    // Store references to timers to clean them up on success/failure
    const timer1 = setTimeout(() => {
      setProgressStep("Invoking AI metadata extraction...");
      toast.loading("Invoking AI metadata extraction...", { id: toastId });
    }, 2000);

    const timer2 = setTimeout(() => {
      setProgressStep("Computing vector embeddings & indexing...");
      toast.loading("Computing vector embeddings & indexing...", { id: toastId });
    }, 5000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/papers/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        throw {
          message: data.error || "Failed to upload paper.",
          isExpected: true,
          status: res.status,
        };
      }

      setStatus("success");
      setIngestedPaper(data.paper);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(`Ingested "${data.paper.title}" successfully!`, { id: toastId });
      if (onUploadSuccess) onUploadSuccess(data.paper);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (err.isExpected) {
        console.warn(`Ingestion warning (${err.status}): ${err.message}`);
      } else {
        console.error("Unexpected ingestion error:", err);
      }
      setStatus("error");
      setErrorMessage(err.message || "An error occurred during upload.");
      toast.error(err.message || "Failed to upload paper.", { id: toastId });
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Ingest Research Paper
      </h2>

      {status === "idle" && (
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                setFile(e.dataTransfer.files[0]);
                setStatus("idle");
                setErrorMessage("");
              }
            }}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all group ${
              isDragging
                ? "border-primary bg-muted/40 scale-[1.01] shadow-inner"
                : "border-border hover:border-primary/40 hover:bg-muted/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-lg bg-muted mx-auto mb-2 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-primary transition-colors">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-xs text-muted-foreground font-medium block">
              {file ? file.name : isDragging ? "Drop your research paper here" : "PDF, TXT, or MD — drag & drop or click to browse"}
            </span>
            {file && (
              <span className="text-[10px] text-muted-foreground/60 block mt-0.5">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!file}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
          >
            Ingest Document
          </button>
        </form>
      )}

      {status === "uploading" && (
        <div className="py-6 text-center space-y-4">
          <div className="relative w-10 h-10 mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full border border-primary/20">
              <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-foreground block">Processing Document</span>
            <span className="text-[10px] text-muted-foreground block animate-pulse">{progressStep}</span>
          </div>
          <div className="h-0.5 bg-border rounded-full overflow-hidden max-w-[180px] mx-auto">
            <div className="h-full bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {status === "success" && ingestedPaper && (
        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3.5 text-xs text-primary flex items-start gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div>
              <span className="font-medium block">Ingested Successfully</span>
              <span className="text-primary/70 mt-0.5 block">Paper parsed, extracted, and indexed.</span>
            </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-3.5 text-xs space-y-2.5">
            <div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Title</span>
              <span className="text-foreground font-medium block leading-relaxed">{ingestedPaper.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Authors</span>
                <span className="text-foreground block truncate">{ingestedPaper.authors}</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Year</span>
                <span className="text-foreground block">{ingestedPaper.publishedYear}</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Abstract</span>
              <p className="text-muted-foreground leading-relaxed line-clamp-2 italic">
                &ldquo;{ingestedPaper.abstract}&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatus("idle")}
            className="w-full py-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium rounded-lg transition-all cursor-pointer"
          >
            Upload Another Paper
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4 py-2">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3.5 text-xs text-destructive flex items-start gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <span className="font-medium block">Ingestion Failed</span>
              <span className="text-destructive/70 mt-0.5 block">{errorMessage}</span>
            </div>
          </div>

          <button
            onClick={() => setStatus("idle")}
            className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
