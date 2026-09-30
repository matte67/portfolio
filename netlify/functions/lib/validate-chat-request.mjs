export const MAX_REQUEST_BYTES = 24 * 1024;
export const MAX_HISTORY_MESSAGES = 9;
export const MAX_MESSAGE_LENGTH = 2_000;

/** Reads request JSON with a hard byte ceiling, including chunked requests. */
export async function readBoundedJson(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw new ChatRequestError(413, "REQUEST_TOO_LARGE");
  }

  if (!request.body) throw new ChatRequestError(400, "INVALID_REQUEST");
  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new ChatRequestError(413, "REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new ChatRequestError(400, "INVALID_REQUEST");
  }
}

/** Validates a short alternating transcript that ends with the new user turn. */
export function validateChatPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ChatRequestError(400, "INVALID_REQUEST");
  }

  const { language, messages } = payload;
  if (language !== "it" && language !== "en") {
    throw new ChatRequestError(400, "INVALID_REQUEST");
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_HISTORY_MESSAGES) {
    throw new ChatRequestError(400, "INVALID_REQUEST");
  }

  const validatedMessages = messages.map((message, index) => {
    const expectedRole = index % 2 === 0 ? "user" : "assistant";
    if (
      !message ||
      typeof message !== "object" ||
      message.role !== expectedRole ||
      typeof message.content !== "string" ||
      message.content.trim().length === 0 ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      throw new ChatRequestError(400, "INVALID_REQUEST");
    }
    return {
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.trim() }],
    };
  });

  if (messages.at(-1).role !== "user") throw new ChatRequestError(400, "INVALID_REQUEST");
  return { language, contents: validatedMessages };
}

export class ChatRequestError extends Error {
  constructor(status, code) {
    super(code);
    this.name = "ChatRequestError";
    this.status = status;
    this.code = code;
  }
}
