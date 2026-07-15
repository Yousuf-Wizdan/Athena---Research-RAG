"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import type { ChatSource } from "@/types/chat";
import SourcesDisplay from "./sources-display";
import { loadingMessages } from "@/lib/consts";
import ConfirmationModal from "./confirmation-modal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  return (
    <div className="flex h-full bg-[#141210]/60 backdrop-blur-md relative overflow-hidden">
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full bg-[#141210]/20 relative">
        {/* Chat Mini-Header */}
        <div className="border-b border-[#36302A] px-6 py-3 flex items-center justify-between bg-[#141210]/40 text-xs z-20 relative">
          <div className="flex items-center gap-2">
            <span className="text-[#9F907E] font-medium">Context Scope:</span>
            {selectedPaperIds.length > 0 ? (
              <span className="text-[#D4783C] font-bold bg-[#D4783C]/10 px-2.5 py-0.5 rounded-full border border-[#D4783C]/25">
                {selectedPaperIds.length} Paper(s) Selected
              </span>
            ) : (
              <span className="text-[#B8943C] font-medium bg-[#B8943C]/10 px-2.5 py-0.5 rounded-full border border-[#B8943C]/25 animate-amber-glow">
                Entire Catalog
              </span>
            )}
          </div>
          
          {/* Interactive Dropdown for Research Sessions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1.5 bg-[#1E1B18] border border-[#36302A] rounded-xl text-[#9F907E] hover:text-[#E6DCC3] font-semibold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer text-[11px] focus:outline-none focus:ring-1 focus:ring-[#D4783C]/40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4783C]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>{activeThreadId ? (threads.find((t) => t.id === activeThreadId)?.title || "Active Session") : "Select Session"}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#9F907E]">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-[#1C1A17] border border-[#36302A] text-[#E6DCC3] rounded-2xl shadow-2xl mt-1.5 p-3.5 space-y-3 z-40">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#36302A]/50">
                <span className="text-[10px] text-[#9F907E] font-bold uppercase tracking-wider">Research Sessions</span>
                <button
                  onClick={handleNewSession}
                  className="text-[10px] text-[#D4783C] hover:text-[#E08950] font-bold transition-all cursor-pointer"
                >
                  + New Session
                </button>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {threads.length === 0 ? (
                  <span className="text-[11px] text-[#9F907E]/50 block py-3 text-center italic">No active sessions</span>
                ) : (
                  threads.map((t) => {
                    const isActive = activeThreadId === t.id;
                    return (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => handleSelectThread(t.id)}
                        className={`group px-2.5 py-2 rounded-lg text-[11px] flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isActive
                            ? "bg-[#D4783C]/10 text-[#D4783C] font-semibold"
                            : "hover:bg-[#D4783C]/5 text-[#9F907E] hover:text-[#E6DCC3]"
                        }`}
                      >
                        <span className="truncate flex-1 pr-1">{t.title}</span>
                        <button
                          onClick={(e) => {
                            initiateDeleteThread(e, t.id);
                          }}
                          className="text-[#9F907E] hover:text-[#B84747] opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Delete session"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Message List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.length === 0 ? (
            <div className="text-center my-auto py-20 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#B8943C]/10 border border-[#B8943C]/25 flex items-center justify-center">
                <span className="font-display text-[#B8943C] text-xl">Ω</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#E6DCC3] font-display">Synthesis Assistant</h3>
                <p className="text-xs text-[#9F907E] leading-relaxed">
                  Select specific papers from the catalog on the left to restrict my context, then ask me to summarize findings, compare models, or explain methodologies.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isAssistant = message.role === "assistant";
              const messageSources = isAssistant ? getSourcesForMessage(message, index) : [];

              return (
                <div key={message.id} className="space-y-2 animate-fade-in">
                  <div
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-md lg:max-w-xl space-y-2">
                      {isAssistant && messageSources.length > 0 && (
                        <div className="pl-1">
                          <SourcesDisplay sources={messageSources} />
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl shadow-md border transition-all ${
                          message.role === "user"
                            ? "bg-[#D4783C] border-[#D4783C]/30 text-[#141210] rounded-br-none"
                            : "bg-[#1E1B18] border-[#36302A] text-[#E6DCC3] rounded-bl-none"
                        }`}
                      >
                        <p className="text-xs whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-[#1E1B18] border border-[#36302A] max-w-md lg:max-w-xl px-5 py-4 rounded-2xl rounded-bl-none shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 bg-[#D4783C]/15 rounded-full animate-ping"></div>
                    <div className="relative flex items-center justify-center w-8 h-8 bg-[#D4783C]/10 rounded-full border border-[#D4783C]/25">
                      <span className="font-display text-[#D4783C] text-sm">Ω</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span
                        key={loadingMessage}
                        className="text-xs text-[#9F907E] font-medium tracking-wide animate-fade-in"
                      >
                        {loadingMessage}
                      </span>
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 bg-[#D4783C] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-[#D4783C] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-[#D4783C] rounded-full animate-bounce"></span>
                      </div>
                    </div>

                    <div className="mt-2 h-1 bg-[#36302A]/50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#D4783C] rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form onSubmit={handleFormSubmit} className="border-t border-[#36302A] bg-[#141210]/80 backdrop-blur-md p-6">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask assistant about papers (e.g. 'Compare their results')"
              rows={1}
              className="flex-1 px-4 py-3 bg-[#1E1B18] border border-[#36302A] rounded-xl focus:outline-none focus:border-[#D4783C]/50 focus:ring-1 focus:ring-[#D4783C]/30 text-[#E6DCC3] placeholder:text-[#9F907E]/50 transition-all text-xs resize-none overflow-y-auto max-h-[180px] min-h-[40px] flex items-center align-middle py-2.5"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-[#D4783C] hover:bg-[#E08950] text-[#141210] font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all transform active:scale-95 text-xs shadow-md shadow-[#D4783C]/20 cursor-pointer animate-fade-in self-end"
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
