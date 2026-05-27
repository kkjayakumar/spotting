const MAX_BODY_CHARS = 64 * 1024;

export function truncateNetworkBody(text: string): string {
  if (text.length <= MAX_BODY_CHARS) return text;
  return `${text.slice(0, MAX_BODY_CHARS)}\n…[truncated]`;
}

export function serializeNetworkRequestBody(
  body: BodyInit | null | undefined,
): string | undefined {
  if (body == null) return undefined;
  if (typeof body === "string") return truncateNetworkBody(body);
  if (body instanceof URLSearchParams) return truncateNetworkBody(body.toString());
  if (body instanceof Blob) {
    return `[blob ${body.type || "application/octet-stream"}, ${body.size} bytes]`;
  }
  if (body instanceof FormData) {
    const parts: string[] = [];
    body.forEach((value, key) => {
      parts.push(`${key}=${typeof value === "string" ? value : "[file]"}`);
    });
    return truncateNetworkBody(parts.join("&"));
  }
  try {
    return truncateNetworkBody(JSON.stringify(body));
  } catch {
    return "[unserializable body]";
  }
}

export async function readNetworkResponseBody(res: Response): Promise<string | undefined> {
  try {
    const contentType = res.headers.get("content-type") ?? "";
    if (
      contentType.includes("octet-stream") ||
      contentType.startsWith("image/") ||
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/")
    ) {
      return `[binary body omitted, ${contentType}]`;
    }
    const clone = res.clone();
    const text = await clone.text();
    return truncateNetworkBody(text);
  } catch {
    return undefined;
  }
}
