interface CachedAttachment {
    name: string;
    contentType: string | null;
    buffer: Buffer;
}

const attachmentCache = new Map<string, CachedAttachment[]>();
const MAX_CACHE_SIZE = 500;

export async function cacheMessageAttachments(
    messageId: string,
    attachments: { id: string; url: string; name: string | null; contentType: string | null }[]
): Promise<void> {
    if (attachments.length === 0) return;
    if (attachmentCache.size >= MAX_CACHE_SIZE) {
        const firstKey = attachmentCache.keys().next().value;
        if (firstKey) attachmentCache.delete(firstKey);
    }
    const cached: CachedAttachment[] = [];
    for (const attachment of attachments) {
        try {
            const response = await fetch(attachment.url);
            if (!response.ok) continue;
            const buffer = Buffer.from(await response.arrayBuffer());
            cached.push({ name: attachment.name ?? "arquivo", contentType: attachment.contentType, buffer });
        } catch { /* ignora falha individual */ }
    }
    if (cached.length > 0) attachmentCache.set(messageId, cached);
}

export function getCachedAttachments(messageId: string): CachedAttachment[] {
    return attachmentCache.get(messageId) ?? [];
}

export function deleteCachedAttachments(messageId: string): void {
    attachmentCache.delete(messageId);
}
