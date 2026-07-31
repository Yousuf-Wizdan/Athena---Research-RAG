import type { ChatSource } from "@/types/chat";
import { BookOpen } from "lucide-react";

interface SourcesDisplayProps {
  sources: ChatSource[];
}

export default function SourcesDisplay({ sources }: SourcesDisplayProps) {
  if (!sources.length) return null;

  return (
    <div className="w-full max-w-md lg:max-w-2xl mb-2">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <div key={`${source.id}-${index}`} className="group relative inline-flex">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/40 hover:bg-primary/10 text-xs rounded-md border border-border hover:border-primary/30 transition-all cursor-default">
              <BookOpen className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              <span className="max-w-[140px] truncate text-muted-foreground group-hover:text-foreground transition-colors">{source.title}</span>
              {source.relevancy !== undefined && (
                <span className="text-[9px] text-muted-foreground/60 font-mono">
                  {Math.round(source.relevancy * 100)}%
                </span>
              )}
            </span>

            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10 w-80 pointer-events-none">
              <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-3.5 max-h-80 overflow-y-auto">
                <div className="text-sm font-medium mb-1.5 text-foreground">{source.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {source.snippet}
                </div>
                <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-popover border-l border-b border-border transform rotate-45" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
