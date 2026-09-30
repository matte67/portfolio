const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
];
const UPSTREAM_TIMEOUT_MS = 18_000;
const MAX_OUTPUT_TOKENS = 600;
const RETRYABLE_STATUSES = new Set([404, 429]);

// Model fallback addresses model availability and per-model rate limits; it cannot bypass project-wide billing or spend caps.

function getModelSequence(configuredModel) {
  if (!configuredModel) return FALLBACK_MODELS;
  return [configuredModel, ...FALLBACK_MODELS.filter((model) => model !== configuredModel)];
}

function isRetryableStatus(status) {
  return RETRYABLE_STATUSES.has(status) || status >= 500;
}

/** Calls Gemini server-side and only fails over for availability/rate-limit errors. */
export async function generatePortfolioAnswer({ apiKey, configuredModel, systemInstruction, contents }) {
  const models = getModelSequence(configuredModel);

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.35 },
          }),
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        clearTimeout(timeout);
        if (isRetryableStatus(response.status) && model !== models.at(-1)) continue;
        if (response.status === 401 || response.status === 403) throw new ChatProviderError("CONFIGURATION");
        throw new ChatProviderError("UPSTREAM_UNAVAILABLE");
      }

      const result = await response.json().catch(() => null);
      const answer = result?.candidates?.[0]?.content?.parts
        ?.map((part) => (typeof part.text === "string" ? part.text : ""))
        .join("")
        .trim();
      if (!answer) throw new ChatProviderError("EMPTY_RESPONSE");
      return answer.slice(0, 8_000);
    } catch (error) {
      if (error instanceof ChatProviderError) throw error;
      if (error?.name === "AbortError") throw new ChatProviderError("TIMEOUT");
      throw new ChatProviderError("UPSTREAM_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new ChatProviderError("UPSTREAM_UNAVAILABLE");
}

export class ChatProviderError extends Error {
  constructor(code) {
    super(code);
    this.name = "ChatProviderError";
    this.code = code;
  }
}
