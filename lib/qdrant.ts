import { QdrantVectorStore } from "@langchain/qdrant";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getProviderConfig } from "@/lib/env-config";
import { QdrantClient } from "@qdrant/js-client-rest";

export const COLLECTION_NAME = "research_papers";

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
 */
export async function getVectorStore(): Promise<QdrantVectorStore> {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url) {
    throw new Error("Qdrant URL not configured. Please set QDRANT_URL in .env.local");
  }

  const cleanApiKey = apiKey && apiKey !== "your_qdrant_api_key_here" ? apiKey : undefined;

  // Ensure payload indexes exist for multi-tenant and document scope queries
  try {
    const qdrantClient = new QdrantClient({
      url,
      apiKey: cleanApiKey,
    });
    
    // Check if the collection exists, otherwise it will create it
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    
    if (exists) {
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.userId",
        field_schema: "keyword",
      });
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.paperId",
        field_schema: "keyword",
      });
    }
  } catch (err) {
    console.error("Failed to ensure payload indexes in Qdrant:", err);
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

