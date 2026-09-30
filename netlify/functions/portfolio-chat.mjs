import { buildSystemInstruction } from "./lib/assistant-context.mjs";
import { ChatProviderError, generatePortfolioAnswer } from "./lib/gemini-provider.mjs";
import { ChatRequestError, readBoundedJson, validateChatPayload } from "./lib/validate-chat-request.mjs";

const noStoreHeaders = {
  "cache-control": "no-store, max-age=0",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
};

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...noStoreHeaders, ...extraHeaders },
  });
}

function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/** Netlify Fetch Function: validates same-origin chat requests and proxies Gemini. */
export default async function portfolioChat(request) {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "METHOD_NOT_ALLOWED" }, { allow: "POST" });
  }
  if (!isSameOriginRequest(request)) return jsonResponse(403, { error: "ORIGIN_NOT_ALLOWED" });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse(415, { error: "UNSUPPORTED_MEDIA_TYPE" });
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return jsonResponse(503, { error: "CHAT_NOT_CONFIGURED" });

  try {
    const payload = validateChatPayload(await readBoundedJson(request));
    const answer = await generatePortfolioAnswer({
      apiKey,
      configuredModel: process.env.GEMINI_MODEL?.trim(),
      systemInstruction: buildSystemInstruction(payload.language),
      contents: payload.contents,
    });
    return jsonResponse(200, { answer });
  } catch (error) {
    if (error instanceof ChatRequestError) return jsonResponse(error.status, { error: error.code });
    if (error instanceof ChatProviderError) {
      const status = error.code === "CONFIGURATION" ? 503 : error.code === "TIMEOUT" ? 504 : 502;
      return jsonResponse(status, { error: error.code });
    }
    return jsonResponse(500, { error: "CHAT_UNAVAILABLE" });
  }
}

export const config = {
  path: "/api/portfolio-chat",
  method: ["POST"],
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
