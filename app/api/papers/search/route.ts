import { NextResponse } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getVectorStore, COLLECTION_NAME, ensureQdrantIndexes } from "@/lib/qdrant";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type PrismaFindManyPaper = Awaited<ReturnType<typeof prisma.paper.findMany>>[number];

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const mode = searchParams.get("mode") || "semantic";
    const yearStart = searchParams.get("yearStart");
    const yearEnd = searchParams.get("yearEnd");

    // Build Prisma filter (only user's papers)
    const whereClause: any = {
      userId: user.id,
    };
    if (yearStart || yearEnd) {
      whereClause.publishedYear = {};
      if (yearStart) whereClause.publishedYear.gte = Number(yearStart);
      if (yearEnd) whereClause.publishedYear.lte = Number(yearEnd);
    }

    // ── Empty query: list all papers ───────────────────────────────────────────
    if (!query.trim()) {
      const papers = await prisma.paper.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ papers });
    }

    // ── Lexical search via Prisma ──────────────────────────────────────────────
    if (mode === "lexical") {
      const papers = await prisma.paper.findMany({
        where: {
          AND: [
            whereClause,
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { authors: { contains: query, mode: "insensitive" } },
                { abstract: { contains: query, mode: "insensitive" } },
              ],
            }
          ]
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ papers });
    }

    // ── Semantic search via LangChain QdrantVectorStore ────────────────────────
    const vectorStore = await getVectorStore();

    // Multi-tenant filter: only search user's own papers
    const mustFilters = [
      { key: "metadata.userId", match: { value: user.id } },
    ];

    // Retrieve top-15 chunks with similarity scores
    const results = await vectorStore.similaritySearchWithScore(query, 15, { must: mustFilters });

    // Aggregate unique paperIds → best score + up to 2 snippet chunks
    const paperScoresMap = new Map<string, { score: number; snippets: string[] }>();
    for (const [doc, score] of results) {
      const paperId = doc.metadata?.paperId as string | undefined;
      if (!paperId) continue;
      const existing = paperScoresMap.get(paperId);
      if (existing) {
        existing.score = Math.max(existing.score, score);
        if (existing.snippets.length < 2) existing.snippets.push(doc.pageContent);
      } else {
        paperScoresMap.set(paperId, { score, snippets: [doc.pageContent] });
      }
    }

    const paperIds = Array.from(paperScoresMap.keys());

    // Retrieve paper metadata from Postgres, apply year & user filters
    const papers = await prisma.paper.findMany({
      where: {
        AND: [
          whereClause,
          { id: { in: paperIds } }
        ]
      },
    });

    // Hydrate with scores + snippets, sort by similarity
    type HydratedPaper = PrismaFindManyPaper & { score: number; snippets: string[] };
    const hydratedPapers: HydratedPaper[] = papers
      .map((paper: PrismaFindManyPaper): HydratedPaper => {
        const scoreData = paperScoresMap.get(paper.id);
        return { ...paper, score: scoreData?.score ?? 0, snippets: scoreData?.snippets ?? [] };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ papers: hydratedPapers });
  } catch (error: any) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: `Failed to search papers: ${error.message || error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("id");
    if (!paperId) {
      return NextResponse.json({ error: "Missing paper ID" }, { status: 400 });
    }

    // Verify paper exists and belongs to the user (legacy global papers are not deletable by regular users)
    const paper = await prisma.paper.findUnique({
      where: { id: paperId }
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (paper.userId && paper.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to this paper" }, { status: 403 });
    }

    // Delete Qdrant vectors for this paper
    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY !== "your_qdrant_api_key_here" ? process.env.QDRANT_API_KEY : undefined,
    });

    // Ensure payload indexes exist via direct REST API (409 = already exists = OK)
    await ensureQdrantIndexes();

    await qdrantClient.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: "metadata.paperId", match: { value: paperId } }],
      },
      wait: true,
    });

    // Delete Postgres metadata
    await prisma.paper.delete({ where: { id: paperId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
