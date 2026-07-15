import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "@/lib/qdrant";
import { getProviderConfig } from "@/lib/env-config";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Parse a PDF buffer using pdf-parse v1.x.
 * Import from lib/pdf-parse (not the index) to skip the test-file loader
 * that triggers ENOENT errors in Next.js server environments.
 * serverExternalPackages: ["pdf-parse"] in next.config.ts ensures Node.js
 * uses native require() instead of Turbopack's ESM resolver for this module.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse") as (
  buffer: Buffer
) => Promise<{ text: string; numpages: number }>;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let fileText = "";

    // ── 1. Extract raw text ────────────────────────────────────────────────────
    if (file.name.endsWith(".pdf")) {
      try {
        const pdfData = await pdfParse(fileBuffer);
        fileText = pdfData.text;
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr);
        return NextResponse.json({ error: "Failed to parse PDF file." }, { status: 422 });
      }
    } else {
      fileText = fileBuffer.toString("utf-8");
    }

    if (!fileText.trim()) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 422 });
    }

    // ── 2. AI Metadata Extraction ──────────────────────────────────────────────
    const providerConfig = getProviderConfig();
    
    // Instantiate AI SDK client based on the provider config
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

    const modelName = providerConfig.provider === "mistral" ? "mistral-large-latest" : "gpt-4o-mini";

    const sampleText = fileText.slice(0, 3000);
    const metadataResult = await generateText({
      model: aiSdkClient(modelName),
      system: `You are an expert academic parser. Extract metadata from the first page of a research paper. Output ONLY a valid JSON object matching this schema:
{
  "title": "Full, clean title (strip tags, remove double quotes, remove linebreaks inside the title)",
  "authors": "Comma-separated list of authors in standard format (e.g., 'John A. Smith, Mary K. Johnson'). Exclude email addresses, professional titles, and affiliations. Normalize formatting",
  "publishedYear": 2024,
  "abstract": "The paper abstract. Extract verbatim if possible. If missing, summarize the first-page introduction in 100-200 words. Escape inner double quotes with \\\""
}

STRICT COMPLIANCE RULES:
- Output ONLY the JSON. No markdown wrappers, no backticks (do not wrap in \`\`\`json), no introductory/concluding text.
- If publishedYear cannot be determined, set it to null (do NOT default to the current year).
- Ensure all text attributes are cleaned of newlines and that nested double quotes are escaped as \\\" so it is fully parseable by JSON.parse.`,
      prompt: `Extract metadata from this first-page text:\n\n${sampleText}`,
    });

    let metadata = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      authors: "Unknown",
      publishedYear: new Date().getFullYear(),
      abstract: "No abstract available.",
    };

    try {
      let cleanJson = metadataResult.text.trim();
      if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
      const parsed = JSON.parse(cleanJson.trim());
      metadata = {
        title: parsed.title || metadata.title,
        authors: parsed.authors || metadata.authors,
        publishedYear: Number(parsed.publishedYear) || metadata.publishedYear,
        abstract: parsed.abstract || metadata.abstract,
      };
    } catch (parseErr) {
      console.warn("Metadata JSON parsing failed, using fallback:", parseErr);
    }

    // ── 3. Save Paper to Postgres via Prisma ───────────────────────────────────
    const paper = await prisma.paper.create({
      data: {
        title: metadata.title,
        authors: metadata.authors,
        abstract: metadata.abstract,
        publishedYear: metadata.publishedYear,
        pdfUrl: file.name,
        userId: user.id,
      },
    });

    // ── 4. Chunk with LangChain RecursiveCharacterTextSplitter ─────────────────
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const rawChunks = await splitter.splitText(fileText);

    // Wrap chunks in LangChain Documents with paper metadata
    const chunks: Document[] = rawChunks.map(
      (chunk, idx) =>
        new Document({
          pageContent: chunk,
          metadata: {
            paperId: paper.id,
            title: paper.title,
            source: file.name,
            chunkIndex: idx,
            userId: paper.userId,
          },
        })
    );

    // ── 5. Embed + Upsert to Qdrant via LangChain QdrantVectorStore ────────────
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);

    return NextResponse.json({
      success: true,
      paper,
      chunksCount: chunks.length,
    });
  } catch (error: any) {
    console.error("Ingestion failed:", error);
    return NextResponse.json(
      { error: `Failed to process research paper: ${error.message || error}` },
      { status: 500 }
    );
  }
}
