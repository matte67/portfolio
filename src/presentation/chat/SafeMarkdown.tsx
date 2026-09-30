import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const KNOWN_ROUTE_PATTERN = /^\/(?:en|it)\/(?:work(?:\/[\w-]+)?|articles(?:\/[\w-]+)?|thesis|about)\/?$/;
const INLINE_TOKEN_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|(\/(?:en|it)\/(?:work(?:\/[\w-]+)?|articles(?:\/[\w-]+)?|thesis|about)\/?)(?![\w/])/g;
const TABLE_SEPARATOR_PATTERN = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/;

function sanitizeHref(rawHref: string): { href: string; external: boolean } | null {
  const value = rawHref.trim();
  if (!value || value.startsWith("//")) return null;
  if (value.startsWith("/")) return { href: value, external: false };

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
      return KNOWN_ROUTE_PATTERN.test(url.pathname)
        ? { href: `${url.pathname}${url.search}${url.hash}`, external: false }
        : null;
    }
    return { href: url.href, external: true };
  } catch {
    return null;
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const normalizedText = text.replace(/\\([*_#`])/g, "$1");
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of normalizedText.matchAll(INLINE_TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(normalizedText.slice(cursor, index));
    const key = `${keyPrefix}-${nodes.length}`;
    if (match[3]) nodes.push(<code key={key}>{match[3]}</code>);
    else if (match[4]) nodes.push(<strong key={key}>{renderInline(match[4], key)}</strong>);
    else if (match[5]) nodes.push(<em key={key}>{renderInline(match[5], key)}</em>);
    else if (match[6]) nodes.push(<Link key={key} to={match[6]}>{match[6]}</Link>);
    else {
      const safeLink = sanitizeHref(match[2]);
      nodes.push(safeLink
        ? safeLink.external
          ? <a href={safeLink.href} key={key} rel="noreferrer" target="_blank">{renderInline(match[1], key)}</a>
          : <Link key={key} to={safeLink.href}>{renderInline(match[1], key)}</Link>
        : match[1]);
    }
    cursor = index + match[0].length;
  }
  if (cursor < normalizedText.length) nodes.push(normalizedText.slice(cursor));
  return nodes;
}

function tableCells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isBlockStart(lines: readonly string[], index: number): boolean {
  const line = lines[index].trim();
  return !line || /^#{1,4}\s/.test(line) || /^[-*+]\s/.test(line) || /^\d+[.)]\s/.test(line)
    || (index + 1 < lines.length && TABLE_SEPARATOR_PATTERN.test(lines[index + 1]));
}

/** Renders a constrained Markdown subset using React elements only; model HTML is never parsed. */
export function SafeMarkdown({ content }: { readonly content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = `h${heading[1].length + 1}` as "h2" | "h3" | "h4" | "h5";
      blocks.push(<Tag key={`block-${index}`}>{renderInline(heading[2], `heading-${index}`)}</Tag>);
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && TABLE_SEPARATOR_PATTERN.test(lines[index + 1])) {
      const headers = tableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="chat-table-scroll" key={`block-${index}`} role="region" aria-label="Scrollable table" tabIndex={0}>
          <table className={headers.length === 4 ? "chat-table chat-table--four-columns" : "chat-table"}>
            <thead><tr>{headers.map((cell, cellIndex) => <th key={`head-${cellIndex}`} scope="col">{renderInline(cell, `th-${cellIndex}`)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{headers.map((_, cellIndex) => <td key={`cell-${cellIndex}`}>{renderInline(row[cellIndex] ?? "", `td-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    const listMatch = /^([-*+]|\d+[.)])\s+/.exec(line);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const current = /^([-*+]|\d+[.)])\s+(.+)$/.exec(lines[index].trim());
        if (!current || /^\d/.test(current[1]) !== ordered) break;
        items.push(current[2]);
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={`block-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `list-${itemIndex}`)}</li>)}</List>);
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`block-${index}`}>{paragraphLines.map((paragraphLine, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{renderInline(paragraphLine, `paragraph-${index}-${lineIndex}`)}</span>)}</p>);
  }

  return <div className="chat-message-markdown">{blocks}</div>;
}
