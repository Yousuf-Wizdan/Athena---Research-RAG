import { QdrantVectorStore } from "@langchain/qdrant";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getProviderConfig } from "@/lib/env-config";

export const COLLECTION_NAME = "research_papers";

/**
 * Creates keyword payload indexes on metadata.paperId and metadata.userId
 * using the Qdrant REST API directly. HTTP 409 (already exists) is treated
 * as success — only genuine failures throw.
 */
export async function ensureQdrantIndexes(): Promise<void> {
  const qdrantUrl = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!qdrantUrl) return;

  const cleanApiKey =
    apiKey && apiKey !== "your_qdrant_api_key_here" ? apiKey : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cleanApiKey) headers["api-key"] = cleanApiKey;

  const createIndex = async (fieldName: string) => {
    const res = await fetch(
      `${qdrantUrl}/collections/${COLLECTION_NAME}/index`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          field_name: fieldName,
          field_schema: "keyword",
        }),
      }
    );
    // 200 = created, 409 = already exists — both are fine
    if (!res.ok && res.status !== 409) {
      const body = await res.text();
      throw new Error(
        `Qdrant index creation failed for '${fieldName}': ${res.status} ${body}`
      );
    }
  };

  await createIndex("metadata.paperId");
  await createIndex("metadata.userId");
}

function getEmbeddings() {
  const config = getProviderConfig();
  if (config.provider === "mistral") {
    return new MistralAIEmbeddings({
      apiKey: config.apiKey,
      model: "mistral-embed",
    });
  } else {
    return new OpenAIEmbeddings({
      apiKey: config.apiKey,
      model: "text-embedding-3-large",
      dimensions: 1024,
    });
  }
}

/**
 * Returns a LangChain QdrantVectorStore connected to the research_papers collection.
 * Also ensures payload indexes exist before returning.
 */
export async function getVectorStore(): Promise<QdrantVectorStore> {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url) {
    throw new Error("Qdrant URL not configured. Please set QDRANT_URL in .env.local");
  }

  const cleanApiKey = apiKey && apiKey !== "your_qdrant_api_key_here" ? apiKey : undefined;

  // Ensure payload indexes exist (idempotent — 409 treated as success)
  try {
    await ensureQdrantIndexes();
  } catch (err) {
    console.error("ensureQdrantIndexes failed:", err);
  }

  return QdrantVectorStore.fromExistingCollection(getEmbeddings(), {
    url,
    apiKey: cleanApiKey,
    collectionName: COLLECTION_NAME,
    collectionConfig: {
      vectors: {
        size: 1024,
        distance: "Cosine",
      },
    },
  });
}

