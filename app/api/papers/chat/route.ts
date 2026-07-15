import { streamText, StreamData } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { ragGraph } from "@/lib/rag-graph";
import type { RagSource } from "@/lib/rag-graph";
import { getSessionUser } from "@/lib/auth";
import { getProviderConfig } from "@/lib/env-config";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, paperIds } = await req.json();

    const userMessage = messages[messages.length - 1];
    const userQuery: string = userMessage?.content ?? "";

    // ── 1. Run LangGraph agentic RAG pipeline ──────────────────────────────────
    let contextString = "";
    let sources: any[] = [];

    if (userQuery) {
      try {
        const graphResult = await ragGraph.invoke({
          query: userQuery,
          originalQuery: userQuery,
          paperIds: paperIds || [],
          userId: user.id,
          messages,
          documents: [],
          rewriteCount: 0,
          contextString: "",
          sources: [],
        });

        contextString = graphResult.contextString ?? "";
        sources = graphResult.sources ?? [];

        if (graphResult.query !== userQuery) {
          console.log(`[Chat] Query was rewritten by RAG graph: "${userQuery}" → "${graphResult.query}"`);
        }
      } catch (graphError) {
        console.error("RAG graph error:", graphError);
        contextString = "Unable to retrieve relevant literature segments at this time.";
      }
    }

    // ── 2. Build system prompt with retrieved context ──────────────────────────
    const systemPrompt = `You are Athena, an elite research professor and literature synthesis engine. Your purpose is to help the user deeply analyze, synthesize, and critically evaluate the provided academic papers.

=== LITERATURE CONTEXT (Retrieved from Selected Papers) ===
${contextString || "No literature search results provided for this query. The user is asking a general research question."}
=== END LITERATURE CONTEXT ===

STRICT ALIGNMENT RULES:
1. RESPONSE INTEGRITY & GROUND-TRUTH:
   - Base all claims about the papers strictly on the provided LITERATURE CONTEXT. Do not fabricate results, parameters, statistics, or findings.
   - Every claim drawn from a paper MUST be explicitly cited at the point of reference using the standard citation format: "[Short Paper Title, Year]" (e.g., "[Transformer Attention, 2017]"). Never write generic citations.
   
2. HANDLING KNOWLEDGE GAPS:
   - If the context does not contain enough information to answer the question, state: "The provided literature does not contain details about this." 
   - You may then provide a general explanation from broader academic knowledge, but you MUST prefix it with: "[General Research Knowledge]" and never attribute these claims to the selected papers.

3. COMPARATIVE ANALYSIS STRUCTURE:
   - When multiple papers are referenced, contrast their objectives, methodologies, and key metrics.
   - Highlight limitations, datasets, and strengths directly. Use bullet points or small markdown grids for comparisons.

4. TONE & CONCISENESS:
   - Academic, direct, and objective. Prioritize density of information over fluff. Be concise.`;

    // ── 3. Stream response via Vercel AI SDK ───────────────────────────────────
    const providerConfig = getProviderConfig();

    const aiSdkClient = createOpenAI(
      providerConfig.provider === "mistral"
        ? {
            baseURL: "https://api.mistral.ai/v1",
            apiKey: providerConfig.apiKey,
          }
        : {
            apiKey: providerConfig.apiKey,
          }
    );

    const modelName = providerConfig.provider === "mistral" ? "mistral-large-latest" : "gpt-4o";

    const data = new StreamData();
    // Map RagSource → ChatSource-compatible shape for frontend
    data.append({
      sources: (sources as RagSource[]).map((s) => ({
        id: s.id,
        title: s.title,
        snippet: s.snippet,
        relevancy: s.similarity,
      })),
    });

    const result = await streamText({
      model: aiSdkClient(modelName),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      onFinish() {
        data.close();
      },
    });

    return result.toDataStreamResponse({ data });
  } catch (error: any) {
    console.error("Error in papers chat:", error);
    return new Response(
      JSON.stringify({ error: `Failed to process papers chat: ${error.message || error}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

