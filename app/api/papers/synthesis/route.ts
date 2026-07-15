import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getProviderConfig } from "@/lib/env-config";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paperIds } = await req.json();

    if (!paperIds || !Array.isArray(paperIds) || paperIds.length < 2) {
      return NextResponse.json(
        { error: "Please select at least 2 papers to generate a synthesis matrix." },
        { status: 400 }
      );
    }

    // Fetch paper abstracts from the DB (restrict to user's papers)
    const papers = await prisma.paper.findMany({
      where: {
        id: { in: paperIds },
        userId: user.id,
      },
    });

    if (papers.length < 2) {
      return NextResponse.json(
        { error: "Selected papers could not be found in your catalog." },
        { status: 404 }
      );
    }

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

    // Build LLM context from selected paper abstracts
    const papersContext = papers
      .map(
        (p, idx) =>
          `Paper [${idx + 1}]:\nTitle: ${p.title}\nAuthors: ${p.authors}\nPublished Year: ${p.publishedYear}\nAbstract: ${p.abstract}`
      )
      .join("\n\n---\n\n");

    const prompt = `You are a distinguished research chair writing a systematic literature review.
Analyze the following papers' details and abstracts, then generate a comprehensive comparative synthesis matrix formatted strictly as a Markdown table.

=== SELECTED PAPERS LITERATURE ===
${papersContext}
=== END SELECTED PAPERS LITERATURE ===

The Markdown table columns MUST be:
1. **Dimension**: The comparison parameter (Objectives, Methodology, Datasets & Models, Key Findings, Strengths, Limitations)
2. Followed by a separate column for each paper. Use the format: "[Main Keyword] ([Year])" as the column header (e.g., "Attention (2017)") to keep columns narrow and readable.

STRICT COMPLIANCE RULES:
- Fill in the row comparison cells with specific, academically precise details extracted from the abstracts. Compare and contrast objectives, metrics, and limitations.
- If a paper's details do not contain info for a dimension, output "N/A based on abstract".
- Do NOT include any pipe characters ("|") within the content of any cell (replace them with dashes or slashes if necessary) to avoid breaking the markdown table boundaries.
- Return ONLY the raw markdown table starting with "| Dimension | ...". Do not write any preamble, intro, conversational filler, or wrap the table in markdown code blocks (\`\`\`).`;

    const result = await generateText({
      model: aiSdkClient(modelName),
      prompt,
    });

    return NextResponse.json({
      success: true,
      matrix: result.text.trim(),
    });
  } catch (error: any) {
    console.error("Synthesis error:", error);
    return NextResponse.json(
      { error: `Failed to generate synthesis matrix: ${error.message || error}` },
      { status: 500 }
    );
  }
}
