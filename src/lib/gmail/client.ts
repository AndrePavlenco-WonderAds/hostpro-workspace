// Thin wrapper around the Gmail REST API — only the endpoints we actually
// need for the import flow. Talks straight to `gmail.googleapis.com` with a
// fresh access token obtained from the long-lived refresh token in env.

import "server-only";
import { refreshAccessToken } from "./oauth";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailMessageHeader = { name: string; value: string };

export type GmailMessagePart = {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: { size: number; data?: string; attachmentId?: string };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  internalDate: string; // ms since epoch
  payload: GmailMessagePart;
};

export type GmailLabel = {
  id: string;
  name: string;
  type?: "system" | "user";
};

export class GmailClient {
  private accessToken: string | null = null;

  constructor(private readonly refreshToken: string) {}

  /** Lazily obtain (and cache for this instance's lifetime) an access token. */
  private async token(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    const { access_token } = await refreshAccessToken(this.refreshToken);
    this.accessToken = access_token;
    return access_token;
  }

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.token();
    const res = await fetch(`${GMAIL_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gmail API ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  // ---------- labels ----------

  async listLabels(): Promise<GmailLabel[]> {
    const res = await this.call<{ labels: GmailLabel[] }>("/labels");
    return res.labels ?? [];
  }

  async createLabel(name: string): Promise<GmailLabel> {
    return this.call<GmailLabel>("/labels", {
      method: "POST",
      body: JSON.stringify({
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    });
  }

  /** Returns the id of the label, creating it if it doesn't exist. */
  async ensureLabel(name: string): Promise<string> {
    const labels = await this.listLabels();
    const found = labels.find((l) => l.name === name);
    if (found) return found.id;
    const created = await this.createLabel(name);
    return created.id;
  }

  // ---------- messages ----------

  /** Gmail search query syntax — see https://support.google.com/mail/answer/7190 */
  async listMessages(query: string, maxResults = 50): Promise<{ id: string; threadId: string }[]> {
    const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
    const res = await this.call<{ messages?: { id: string; threadId: string }[] }>(
      `/messages?${params.toString()}`,
    );
    return res.messages ?? [];
  }

  async getMessage(id: string): Promise<GmailMessage> {
    return this.call<GmailMessage>(`/messages/${id}?format=full`);
  }

  async modifyMessage(
    id: string,
    addLabelIds: string[],
    removeLabelIds: string[] = [],
  ): Promise<void> {
    await this.call(`/messages/${id}/modify`, {
      method: "POST",
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    });
  }
}

// ---------- message helpers ----------

export function getHeader(msg: GmailMessage, name: string): string | undefined {
  const headers = msg.payload.headers ?? [];
  const found = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return found?.value;
}

/** Walk the MIME tree and concat all text/html parts. */
export function extractHtmlBody(msg: GmailMessage): string {
  return collectByMime(msg.payload, "text/html");
}

/** Walk the MIME tree and concat all text/plain parts. */
export function extractPlainBody(msg: GmailMessage): string {
  return collectByMime(msg.payload, "text/plain");
}

function collectByMime(part: GmailMessagePart, mime: string): string {
  const chunks: string[] = [];
  walk(part, (p) => {
    if (p.mimeType === mime && p.body?.data) {
      chunks.push(decodeBase64Url(p.body.data));
    }
  });
  return chunks.join("\n");
}

function walk(part: GmailMessagePart, fn: (p: GmailMessagePart) => void): void {
  fn(part);
  for (const child of part.parts ?? []) walk(child, fn);
}

function decodeBase64Url(s: string): string {
  // Gmail returns body data as base64url (RFC 4648 §5). Convert to base64
  // then decode through Buffer (Node) or atob (Edge runtimes).
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (s.length % 4)) % 4);
  try {
    return Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return atob(b64);
  }
}

/** Strip HTML tags, decode entities — gives a plain-text projection of an
 *  HTML body suitable for regex parsing without paying the cost of a full
 *  DOM parser. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x?([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCodePoint(parseInt(code, code.startsWith("x") ? 16 : 10)),
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
