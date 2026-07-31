/**
 * LLM Provider Configuration
 * Dynamically selects Mistral or OpenAI depending on configured keys in .env.local,
 * filtering out placeholders.
 */

export type ProviderType = "mistral" | "openai";

export interface ProviderConfig {
  provider: ProviderType;
  apiKey: string;
}

export function getProviderConfig(): ProviderConfig {
  const mistralKey = process.env.MISTRAL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const hasMistral =
    mistralKey &&
    mistralKey.trim() !== "" &&
    mistralKey !== "your_mistral_api_key_here";

  const hasOpenAi =
    openaiKey &&
    openaiKey.trim() !== "" &&
    openaiKey !== "your_openai_api_key_here";

  if (hasMistral) {
    return {
      provider: "mistral",
      apiKey: mistralKey.trim(),
    };
  } else if (hasOpenAi) {
    return {
      provider: "openai",
      apiKey: openaiKey.trim(),
    };
  } else {
    throw new Error(
      "No valid LLM API key found. Please set MISTRAL_API_KEY or OPENAI_API_KEY in your .env.local file."
    );
  }
}
