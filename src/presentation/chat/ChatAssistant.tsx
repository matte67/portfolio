import { faArrowUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { getPageCopy } from "../../application/pageCopy";
import { useLanguage } from "../../application/i18n";
import type {
  ChatApiResponse,
  ChatMessage,
} from "../../application/chat/chatTypes";
import { SafeMarkdown } from "./SafeMarkdown";
import "./ChatAssistant.css";

const CHAT_ENDPOINT = "/api/portfolio-chat";
const MAX_COMPLETED_TURNS = 4;
const MAX_HISTORY_MESSAGE_LENGTH = 2_000;
const MAX_VISIBLE_TRANSCRIPT_MESSAGES = 24;

function createMessage(
  role: ChatMessage["role"],
  content: string,
  includeInHistory = true,
): ChatMessage {
  return { id: crypto.randomUUID(), role, content, includeInHistory };
}

/** Keeps only four complete turns and the newest user prompt for each request. */
function getRequestHistory(
  messages: readonly ChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  const transcript = messages.filter((message) => message.includeInHistory);
  const latest = transcript.at(-1);
  if (!latest || latest.role !== "user") return [];

  const completedTurns: Array<{ role: "user" | "assistant"; content: string }> =
    [];
  for (let index = 0; index < transcript.length - 1; index += 1) {
    const userMessage = transcript[index];
    const assistantMessage = transcript[index + 1];
    if (userMessage.role === "user" && assistantMessage?.role === "assistant") {
      completedTurns.push(userMessage, assistantMessage);
      index += 1;
    }
  }
  return [...completedTurns.slice(-MAX_COMPLETED_TURNS * 2), latest].map(
    ({ role, content }) => ({
      role,
      content: content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }),
  );
}

function trimVisibleTranscript(
  messages: readonly ChatMessage[],
): ChatMessage[] {
  const welcome = messages.find((message) => !message.includeInHistory);
  const transcript = messages
    .filter((message) => message.includeInHistory)
    .slice(-MAX_VISIBLE_TRANSCRIPT_MESSAGES);
  return welcome ? [welcome, ...transcript] : transcript;
}

function getLocalizedError(
  status: number,
  chatCopy: {
    readonly rateLimit: string;
    readonly unavailable: string;
    readonly error: string;
  },
) {
  if (status === 429) return chatCopy.rateLimit;
  if (status === 503) return chatCopy.unavailable;
  return chatCopy.error;
}

/** A compact, non-modal portfolio chat that stays mounted during client navigation. */
export function ChatAssistant() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "layout");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage("assistant", copy.chat.welcome, false),
  ]);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => textareaRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending, error]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        requestAnimationFrame(() => launcherRef.current?.focus());
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        panelRef.current?.contains(target) ||
        launcherRef.current?.contains(target)
      )
        return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const requestAnswer = useCallback(
    async (nextMessages: readonly ChatMessage[]) => {
      const controller = new AbortController();
      requestControllerRef.current?.abort();
      requestControllerRef.current = controller;
      setIsSending(true);
      setError(null);

      try {
        const response = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            language,
            messages: getRequestHistory(nextMessages),
          }),
          signal: controller.signal,
        });
        const payload = await response
          .json()
          .catch((): ChatApiResponse => ({}));
        if (
          !response.ok ||
          typeof payload.answer !== "string" ||
          !payload.answer.trim()
        ) {
          setError(getLocalizedError(response.status, copy.chat));
          return;
        }
        setMessages((current) =>
          trimVisibleTranscript([
            ...current,
            createMessage("assistant", payload.answer!.trim()),
          ]),
        );
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError(copy.chat.error);
      } finally {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
          setIsSending(false);
        }
      }
    },
    [language, copy.chat],
  );

  const sendDraft = useCallback(() => {
    const content = draft.trim();
    if (!content || isSending) return;
    const nextMessages = [...messages, createMessage("user", content)];
    setMessages(trimVisibleTranscript(nextMessages));
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    void requestAnswer(nextMessages);
  }, [draft, isSending, messages, requestAnswer]);

  const cancelRequest = () => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsSending(false);
  };

  const retryRequest = () => {
    if (isSending) return;
    void requestAnswer(messages);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      sendDraft();
    }
  };

  return createPortal(
    <div className="portfolio-chat">
      {isOpen && (
        <section
          aria-label={copy.chat.title}
          className="portfolio-chat__panel"
          ref={panelRef}
        >
          <header className="portfolio-chat__header">
            <div className="portfolio-chat__identity">
              <span
                className={`portfolio-chat__avatar${
                  isSending ? " is-thinking" : ""
                }`}
              >
                <img
                  alt=""
                  aria-hidden="true"
                  src="/media/chat/portfolio-assistant.png"
                />
              </span>
              <div>
                <h2>{copy.chat.title}</h2>
              </div>
            </div>
            <button
              aria-label={copy.chat.close}
              className="portfolio-chat__icon-button"
              onClick={() => {
                setIsOpen(false);
                launcherRef.current?.focus();
              }}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
            </button>
          </header>

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="portfolio-chat__messages"
            ref={transcriptRef}
          >
            {messages.map((message) => (
              <article
                className={`portfolio-chat__message portfolio-chat__message--${message.role}`}
                key={message.id}
              >
                {message.role === "assistant" && (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="portfolio-chat__message-avatar"
                    src="/media/chat/portfolio-assistant.png"
                  />
                )}
                <div className="portfolio-chat__bubble">
                  <SafeMarkdown content={message.content} />
                </div>
              </article>
            ))}

            {isSending && (
              <div className="portfolio-chat__typing" role="status">
                <img
                  alt=""
                  aria-hidden="true"
                  className="portfolio-chat__message-avatar is-thinking"
                  src="/media/chat/portfolio-assistant.png"
                />
                <span>{copy.chat.typing}</span>
                <span
                  aria-hidden="true"
                  className="portfolio-chat__typing-dots"
                >
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}

            {error && (
              <div className="portfolio-chat__error" role="alert">
                <p>{error}</p>
                {messages.some(
                  (message) =>
                    message.role === "user" && message.includeInHistory,
                ) && (
                  <button onClick={retryRequest} type="button">
                    {copy.chat.retry}
                  </button>
                )}
                {error === copy.chat.unavailable && (
                  <a href="mailto:matteo01.vittori@icloud.com">
                    matteo01.vittori@icloud.com
                  </a>
                )}
              </div>
            )}
          </div>

          <form
            className="portfolio-chat__composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendDraft();
            }}
          >
            <label className="visually-hidden" htmlFor="portfolio-chat-input">
              {copy.chat.placeholder}
            </label>
            <textarea
              autoComplete="off"
              className="portfolio-chat__input"
              id="portfolio-chat-input"
              maxLength={2_000}
              onChange={(event) => {
                setDraft(event.currentTarget.value);
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${Math.min(
                  event.currentTarget.scrollHeight,
                  120,
                )}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={copy.chat.placeholder}
              ref={textareaRef}
              rows={1}
              value={draft}
            />
            {isSending ? (
              <button
                aria-label={copy.chat.cancel}
                className="portfolio-chat__send portfolio-chat__send--cancel"
                onClick={cancelRequest}
                type="button"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
              </button>
            ) : (
              <button
                aria-label={copy.chat.send}
                className="portfolio-chat__send"
                disabled={!draft.trim()}
                type="submit"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faArrowUp} />
              </button>
            )}
          </form>
          <div className="portfolio-chat__privacy">
            <span>{copy.chat.privacy}</span>
            <details>
              <summary aria-label={copy.chat.privacyDetails}>i</summary>
              <p>{copy.chat.privacyDetails}</p>
            </details>
          </div>
        </section>
      )}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? copy.chat.close : copy.chat.launcher}
        className={`portfolio-chat__launcher${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        ref={launcherRef}
        type="button"
      >
        {isOpen ? (
          <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
        ) : (
          <img
            alt=""
            aria-hidden="true"
            src="/media/chat/portfolio-assistant.png"
          />
        )}
      </button>
    </div>,
    document.body,
  );
}
