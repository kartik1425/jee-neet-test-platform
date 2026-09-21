import { AIProvider } from "./provider";
import { GeminiAdapter } from "./geminiAdapter";
import { MockAIProvider } from "./mockAdapter";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;
  if (apiKey && apiKey.trim() !== "" && apiKey !== "mock") {
    cachedProvider = new GeminiAdapter(apiKey, modelName);
  } else {
    cachedProvider = new MockAIProvider();
  }

  return cachedProvider;
}
