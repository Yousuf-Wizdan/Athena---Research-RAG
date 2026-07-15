/**
 * LangGraph Agentic RAG Graph
 *
 * Nodes:
 *   retrieve        → embed query, fetch top-K docs from Qdrant filtered by paperIds
 *   grade_documents → filter docs below relevance threshold; count rewrites
 *   rewrite_query   → rewrite the user query with ChatMistralAI if docs are sparse
 *   generate        → assemble context + call Mistral via Vercel AI SDK (streaming)
 *
 * Edges:
 *   START → retrieve → grade_documents
 *   grade_documents → generate  (enough relevant docs, or rewrite limit hit)
 *   grade_documents → rewrite_query (too few relevant docs and rewrites < MAX_REWRITES)
 *   rewrite_query   → retrieve
 *   generate        → END
 */

import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "@/lib/qdrant";
import { getProviderConfig } from "@/lib/env-config";

// ── Graph state shape ──────────────────────────────────────────────────────────

const GraphState = Annotation.Root({
  /** Latest user query (may be rewritten) */
  query: Annotation<string>({ reducer: (_, b) => b }),
  /** Original user query (never overwritten) */
  originalQuery: Annotation<string>({ reducer: (_, b) => b }),
  /** Paper IDs to filter Qdrant results */
  paperIds: Annotation<string[]>({ reducer: (_, b) => b }),
  /** Authenticated User ID to enforce multi-tenant isolation */
  userId: Annotation<string | null>({ reducer: (_, b) => b }),
  /** Retrieved + graded context documents */
  documents: Annotation<Document[]>({ reducer: (_, b) => b }),
  /** Full message history from the frontend */
  messages: Annotation<{ role: string; content: string }[]>({ reducer: (_, b) => b }),
  /** Number of query rewrites performed so far */
  rewriteCount: Annotation<number>({ reducer: (_, b) => b }),
  /** Final assembled context string for generation */
  contextString: Annotation<string>({ reducer: (_, b) => b }),
  /** Source cards returned alongside the streamed answer */
  sources: Annotation<RagSource[]>({ reducer: (_, b) => b }),
});

export type RagGraphState = typeof GraphState.State;

export interface RagSource {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  similarity: number;
}

const MAX_REWRITES = 1;
const MIN_RELEVANT_DOCS = 2;
const RELEVANCE_THRESHOLD = 0.55;

// ── Helper: get LLM ────────────────────────────────────────────────────────────

function getChatModel() {
  const config = getProviderConfig();
  if (config.provider === "mistral") {
    return new ChatMistralAI({
      apiKey: config.apiKey,
      model: "mistral-large-latest",
      temperature: 0.2,
    });
  } else {
    return new ChatOpenAI({
      apiKey: config.apiKey,
      model: "gpt-4o",
      temperature: 0.2,
    });
  }
}

// ── Node: retrieve ─────────────────────────────────────────────────────────────

async function retrieve(state: RagGraphState): Promise<Partial<RagGraphState>> {
  const vectorStore = await getVectorStore();

  const mustFilters: any[] = [];

  // Enforce multi-tenant containment: user can only see their own papers
  if (state.userId) {
    mustFilters.push({
      key: "metadata.userId",
      match: { value: state.userId },
    });
  }

  // Enforce paperId filter if specific papers are selected
  if (state.paperIds && state.paperIds.length > 0) {
    mustFilters.push({
      key: "metadata.paperId",
      match: { any: state.paperIds },
    });
  }

  const filter = mustFilters.length > 0 ? { must: mustFilters } : undefined;

  const results = await vectorStore.similaritySearchWithScore(state.query, 10, filter);

  const documents = results.map(([doc, score]) => {
    return new Document({
      pageContent: doc.pageContent,
      metadata: { ...doc.metadata, score },
    });
  });

  return { documents };
}

// ── Node: grade_documents ──────────────────────────────────────────────────────

async function gradeDocuments(state: RagGraphState): Promise<Partial<RagGraphState>> {
  const relevant = state.documents.filter(
    (doc) => (doc.metadata.score ?? 0) >= RELEVANCE_THRESHOLD
  );

  const contextString = relevant.length > 0
    ? relevant
        .map((doc, i) => `Document [${i + 1}] (Title: ${doc.metadata.title}):\n${doc.pageContent}`)
        .join("\n\n---\n\n")
    : "";

  const sources: RagSource[] = relevant.map((doc) => ({
    id: String(doc.metadata.paperId ?? doc.id ?? Math.random()),
    title: doc.metadata.title ?? "Unknown",
    snippet: doc.pageContent,
    similarity: doc.metadata.score ?? 0,
  }));

  return {
    documents: relevant,
    contextString,
    sources,
  };
}

// ── Node: rewrite_query ────────────────────────────────────────────────────────

async function rewriteQuery(state: RagGraphState): Promise<Partial<RagGraphState>> {
  const llm = getChatModel();

  const response = await llm.invoke([
    new SystemMessage(
      "You are an academic search query optimizer for vector similarity retrieval. " +
        "Your task is to rewrite vague or conversational queries into precise, high-recall keyword strings containing domain-specific academic terminology and synonyms.\n\n" +
        "STRATEGIES:\n" +
        "- Strip out conversational elements (e.g., 'tell me about', 'please search for', 'what is', 'can you').\n" +
        "- Translate vague expressions into exact academic/scientific concepts.\n" +
        "- Append relevant synonyms and technical terms associated with the subject.\n" +
        "- Avoid boolean search operators (AND, OR, NOT) or punctuation that might degrade vector similarity scores.\n\n" +
        "EXAMPLES:\n" +
        "- Input: 'Explain how transformers do attention'\n" +
        "  Output: 'self-attention mechanism transformer architecture neural network attention weights query key value projection'\n\n" +
        "- Input: 'What is the speed of llama 3 vs gpt 4'\n" +
        "  Output: 'inference speed throughput tokens per second Llama 3 GPT-4 large language model latency benchmark comparison'\n\n" +
        "Return ONLY the improved query string. No explanations, no quotes, no conversational text."
    ),
    new HumanMessage(
      `The following query returned few relevant results from a research paper database.\n` +
        `Original query: "${state.originalQuery}"\n` +
        `Improved query:`
    ),
  ]);

  const rewrittenQuery = (response.content as string).trim();
  console.log(`[RAG Graph] Query rewritten: "${state.query}" → "${rewrittenQuery}"`);

  return {
    query: rewrittenQuery,
    rewriteCount: state.rewriteCount + 1,
  };
}

// ── Node: generate (returns context + sources; caller handles streaming) ───────

async function generate(state: RagGraphState): Promise<Partial<RagGraphState>> {
  // This node just finalises the state — the chat route streams using Vercel AI SDK
  return {
    contextString: state.contextString,
    sources: state.sources,
  };
}

// ── Routing logic ──────────────────────────────────────────────────────────────

function shouldRewrite(state: RagGraphState): "rewrite_query" | "generate" {
  const hasEnoughDocs = state.documents.length >= MIN_RELEVANT_DOCS;
  const rewriteLimitHit = state.rewriteCount >= MAX_REWRITES;

  if (hasEnoughDocs || rewriteLimitHit) {
    return "generate";
  }
  return "rewrite_query";
}

// ── Build and export graph ─────────────────────────────────────────────────────

const workflow = new StateGraph(GraphState)
  .addNode("retrieve", retrieve)
  .addNode("grade_documents", gradeDocuments)
  .addNode("rewrite_query", rewriteQuery)
  .addNode("generate", generate)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "grade_documents")
  .addConditionalEdges("grade_documents", shouldRewrite, {
    rewrite_query: "rewrite_query",
    generate: "generate",
  })
  .addEdge("rewrite_query", "retrieve")
  .addEdge("generate", END);

export const ragGraph = workflow.compile();
