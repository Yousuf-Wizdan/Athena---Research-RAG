"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatSource } from "@/types/chat";
import SourcesDisplay from "./sources-display";
import { loadingMessages } from "@/lib/consts";
import ConfirmationModal from "./confirmation-modal";
import { toast } from "sonner";
import { MessageSquare, ChevronDown, Trash2, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatProps {
  selectedPaperIds: string[];
}

interface Thread {
  id: string;
  title: string;
  createdAt: string;
}

function CitationBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber/10 border border-amber/20 text-amber rounded-md text-[inherit] font-medium whitespace-nowrap not-prose">
      {children}
    </span>
  );
}

function formatCitation(text: string): (string | { type: "citation"; text: string })[] {
  const parts: (string | { type: "citation"; text: string })[] = [];
  const regex = /\[([^\]]*\d{4}[^\]]*)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: "citation", text: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function TextWithCitations({ children }: { children: string }) {
  const parts = formatCitation(children);
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <CitationBadge key={i}>{part.text}</CitationBadge>
        )
      )}
    </>
  );
}

export default function Chat({ selectedPaperIds }: ChatProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [cachedSources, setCachedSources] = useState<Record<string, ChatSource[]>>({});
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const inputRef = useRef("");

  const { messages, input, handleInputChange, handleSubmit, isLoading, data, setMessages, setInput } = useChat({
    api: "/api/papers/chat",
    body: {
      paperIds: selectedPaperIds,
    },
    onFinish: async (message) => {
      let currentThreadId = activeThreadId;

      if (!currentThreadId) {
        try {
          const threadRes = await fetch("/api/threads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: inputRef.current }),
          });
          if (!threadRes.ok) {
            throw { message: "Failed to create thread", isExpected: true, status: threadRes.status };
          }
          const threadData = await threadRes.json();
          if (threadData.thread) {
            currentThreadId = threadData.thread.id;
            setActiveThreadId(currentThreadId);
            fetchThreads();
          }
        } catch (err: any) {
          if (err.isExpected) {
            console.warn(`Chat warning (${err.status}): ${err.message}`);
          } else {
            console.error("Failed to create thread:", err);
          }
          return;
        }
      }

      try {
        const userMsgRes = await fetch(`/api/threads/${currentThreadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "user",
            content: inputRef.current,
          }),
        });
        if (!userMsgRes.ok) {
          throw { message: "Failed to save user message", isExpected: true, status: userMsgRes.status };
        }

        const sourceItem = Array.isArray(data)
          ? data.find((d) => d !== null && typeof d === "object" && !Array.isArray(d) && "sources" in d)
          : undefined;
        const activeSources = (sourceItem as unknown as { sources: ChatSource[] })?.sources ?? [];

        const assgRes = await fetch(`/api/threads/${currentThreadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: message.content,
            sources: activeSources,
          }),
        });
        if (!assgRes.ok) {
          throw { message: "Failed to save assistant message", isExpected: true, status: assgRes.status };
        }

        const savedMsg = await assgRes.json();
        if (savedMsg.message) {
          setCachedSources((prev) => ({
            ...prev,
            [savedMsg.message.id]: activeSources,
          }));
        }
      } catch (err: any) {
        if (err.isExpected) {
          console.warn(`Chat warning (${err.status}): ${err.message}`);
        } else {
          console.error("Failed to save message history:", err);
        }
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate chat response.");
    },
  });

  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom(isLoading ? "auto" : "smooth");
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeThreadId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        inputRef.current = input;
        handleSubmit(e as any);
      }
    }
  };

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/threads");
      if (!res.ok) {
        throw { message: "Failed to load threads", isExpected: true, status: res.status };
      }
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Chat warning (${err.status}): ${err.message}`);
      } else {
        console.error("Failed to load threads:", err);
      }
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleSelectThread = async (threadId: string) => {
    setActiveThreadId(threadId);
    setMessages([]);
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`);
      if (!res.ok) {
        throw { message: "Failed to load messages", isExpected: true, status: res.status };
      }
      const data = await res.json();
      setMessages(
        data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.createdAt),
        }))
      );

      const sourcesMap: Record<string, ChatSource[]> = {};
      data.messages.forEach((m: any) => {
        if (m.sources) {
          sourcesMap[m.id] = m.sources;
        }
      });
      setCachedSources(sourcesMap);
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Chat warning (${err.status}): ${err.message}`);
      } else {
        console.error("Failed to load messages:", err);
      }
    }
  };

  const handleNewSession = () => {
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
    toast.success("New research session started.");
  };

  const initiateDeleteThread = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setDeleteThreadId(threadId);
  };

  const confirmDeleteThread = async () => {
    if (!deleteThreadId) return;
    const threadId = deleteThreadId;
    setDeleteThreadId(null);
    const toastId = toast.loading("Deleting research session...");

    try {
      const res = await fetch(`/api/threads?id=${threadId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw { message: "Failed to delete thread", isExpected: true, status: res.status };
      }
      if (activeThreadId === threadId) {
        handleNewSession();
      }
      fetchThreads();
      toast.success("Research session deleted successfully.", { id: toastId });
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Chat warning (${err.status}): ${err.message}`);
      } else {
        console.error("Failed to delete thread:", err);
      }
      toast.error(err.message || "Failed to delete session.", { id: toastId });
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    inputRef.current = input;
    handleSubmit(e);
  };

  useEffect(() => {
    if (!isLoading) return;

    setLoadingMessage(
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
    );

    const changeMessage = () => {
      setLoadingMessage((prev) => {
        let newMessage;
        do {
          newMessage =
            loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        } while (newMessage === prev && loadingMessages.length > 1);
        return newMessage;
      });
    };

    const getRandomInterval = () => 1500 + Math.random() * 2000;

    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        changeMessage();
        scheduleNext();
      }, getRandomInterval());
    };

    scheduleNext();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const getSourcesForMessage = (msg: { id: string }, msgIdx: number) => {
    if (cachedSources[msg.id]) {
      return cachedSources[msg.id];
    }

    const dataArray = Array.isArray(data) ? data : [];
    const allSourcesItems = dataArray.filter(
      (d: unknown): d is { sources: unknown } =>
        d !== null && typeof d === "object" && "sources" in d
    );

    let assistantCount = 0;
    for (let i = 0; i <= msgIdx; i++) {
      if (messages[i].role === "assistant") {
        assistantCount++;
      }
    }
    const item = allSourcesItems[assistantCount - 1];
    return (item as unknown as { sources: ChatSource[] })?.sources ?? [];
  };

  const markdownComponents = {
    h1: ({ children, ...props }: any) => (
      <h1 className="text-base font-bold tracking-tight text-foreground mb-3 mt-4 first:mt-0" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-sm font-bold tracking-tight text-foreground mb-2 mt-4 first:mt-0" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xs font-semibold text-foreground mb-2 mt-3 first:mt-0" {...props}>{children}</h3>
    ),
    p: ({ children, ...props }: any) => {
      if (typeof children === "string") {
        return <p className="text-xs leading-relaxed mb-2 last:mb-0" {...props}><TextWithCitations>{children}</TextWithCitations></p>;
      }
      const text = extractText(children);
      if (text) {
        return <p className="text-xs leading-relaxed mb-2 last:mb-0" {...props}><TextWithCitations>{text}</TextWithCitations></p>;
      }
      return <p className="text-xs leading-relaxed mb-2 last:mb-0" {...props}>{children}</p>;
    },
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc pl-5 space-y-0.5 mb-2 text-xs text-muted-foreground" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal pl-5 space-y-0.5 mb-2 text-xs text-muted-foreground" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => {
      if (typeof children === "string") {
        return <li className="leading-relaxed" {...props}><TextWithCitations>{children}</TextWithCitations></li>;
      }
      const text = extractText(children);
      if (text) {
        return <li className="leading-relaxed" {...props}><TextWithCitations>{text}</TextWithCitations></li>;
      }
      return <li className="leading-relaxed" {...props}>{children}</li>;
    },
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-2 border-amber/40 pl-3 italic text-muted-foreground mb-2 text-xs" {...props}>{children}</blockquote>
    ),
    code: ({ className, children, ...props }: any) => {
      const isInline = !className;
      if (isInline) {
        return <code className="bg-muted/60 px-1 py-0 rounded text-[11px] font-mono text-amber" {...props}>{children}</code>;
      }
      return (
        <pre className="bg-muted/40 border border-border rounded-lg p-3 overflow-x-auto mb-2 text-[11px] font-mono leading-relaxed">
          <code className={className} {...props}>{children}</code>
        </pre>
      );
    },
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto border border-border rounded-lg mb-3">
        <table className="w-full text-left text-xs border-collapse" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="border-b border-border bg-muted/30" {...props}>{children}</thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody className="divide-y divide-border/50" {...props}>{children}</tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className="hover:bg-primary/[0.02] transition-colors" {...props}>{children}</tr>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-3 py-2 font-semibold text-foreground tracking-wide whitespace-nowrap" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => {
      if (typeof children === "string") {
        return <td className="px-3 py-2 text-muted-foreground leading-relaxed" {...props}><TextWithCitations>{children}</TextWithCitations></td>;
      }
      const text = extractText(children);
      if (text) {
        return <td className="px-3 py-2 text-muted-foreground leading-relaxed" {...props}><TextWithCitations>{text}</TextWithCitations></td>;
      }
      return <td className="px-3 py-2 text-muted-foreground leading-relaxed" {...props}>{children}</td>;
    },
    hr: ({ ...props }: any) => (
      <hr className="border-border/50 my-3" {...props} />
    ),
    a: ({ href, children, ...props }: any) => (
      <a href={href} className="text-primary underline decoration-primary/30 hover:decoration-primary transition-all" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
  };

  return (
    <div className="flex h-full bg-background/60 backdrop-blur-md relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full bg-background/20 relative">
        <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-background/40 text-xs z-20 relative">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Context Scope:</span>
            {selectedPaperIds.length > 0 ? (
              <span className="text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/25">
                {selectedPaperIds.length} Paper(s) Selected
              </span>
            ) : (
              <span className="text-gold font-medium bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/25 animate-amber-glow">
                Entire Catalog
              </span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40">
                <MessageSquare className="w-3 h-3 text-primary" />
                <span>{activeThreadId ? (threads.find((t) => t.id === activeThreadId)?.title || "Active Session") : "Select Session"}</span>
                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-popover border border-border text-popover-foreground rounded-2xl shadow-2xl mt-1.5 p-3.5 space-y-3 z-40">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Research Sessions</span>
                <button
                  onClick={handleNewSession}
                  className="text-[10px] text-primary hover:text-primary/80 font-bold transition-all cursor-pointer"
                >
                  + New Session
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {threads.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground/50 block py-3 text-center italic">No active sessions</span>
                ) : (
                  threads.map((t) => {
                    const isActive = activeThreadId === t.id;
                    return (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => handleSelectThread(t.id)}
                        className={`group px-2.5 py-2 rounded-lg text-[11px] flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="truncate flex-1 pr-1">{t.title}</span>
                        <button
                          onClick={(e) => {
                            initiateDeleteThread(e, t.id);
                          }}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Delete session"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6"
        >
          {messages.length === 0 ? (
            <div className="text-center my-auto py-20 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground font-display">Synthesis Assistant</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select papers from the catalog on the left to restrict my context, then ask me to summarize findings, compare models, or explain methodologies.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-8">
              {messages.map((message, index) => {
                const isAssistant = message.role === "assistant";
                const messageSources = isAssistant ? getSourcesForMessage(message, index) : [];

                return (
                  <div key={message.id} className="animate-fade-in group">
                    <div className={`flex items-center gap-2 mb-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {isAssistant && (
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          Athena
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/40 font-mono">
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                      {message.role === "user" && (
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>

                    {isAssistant && messageSources.length > 0 && (
                      <div className="mb-3">
                        <SourcesDisplay sources={messageSources} />
                      </div>
                    )}

                    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] px-5 py-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                            : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md shadow-sm"
                        }`}
                      >
                        {isAssistant ? (
                          <div className="prose-quoteless">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Athena</span>
                <span className="text-[10px] text-muted-foreground/40 font-mono">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md shadow-sm px-5 py-4 max-w-[85%]">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 shrink-0">
                    <div className="absolute inset-0 bg-primary/15 rounded-full animate-ping" />
                    <div className="relative flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full border border-primary/25">
                      <span className="font-display text-primary text-sm">Ω</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span key={loadingMessage} className="text-xs text-muted-foreground font-medium tracking-wide animate-fade-in truncate">
                        {loadingMessage}
                      </span>
                      <div className="flex gap-0.5 shrink-0">
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} className="border-t border-border bg-background/80 backdrop-blur-md p-6">
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your papers..."
              rows={1}
              className="flex-1 px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/50 transition-all text-xs resize-none overflow-y-auto max-h-[180px] min-h-[44px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 text-xs shadow-md shadow-primary/20 cursor-pointer self-end"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={deleteThreadId !== null}
        title="Delete Research Session"
        message="Are you sure you want to delete this research session and all its message history? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeleteThread}
        onCancel={() => setDeleteThreadId(null)}
      />
    </div>
  );
}

function extractText(children: React.ReactNode): string | null {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    const texts: string[] = [];
    for (const child of children) {
      if (typeof child === "string") {
        texts.push(child);
      } else if (child && typeof child === "object" && "props" in child) {
        const inner = extractText((child as any).props?.children);
        if (inner) texts.push(inner);
      }
    }
    return texts.length > 0 ? texts.join("") : null;
  }
  return null;
}
