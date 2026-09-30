export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  /** Welcome copy is presentation-only and is not forwarded to the provider. */
  readonly includeInHistory: boolean;
}

export interface ChatApiResponse {
  readonly answer?: string;
  readonly error?: string;
}
