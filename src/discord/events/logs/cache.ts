/**
 * Cache em memória de anexos de mensagens.
 * Quando uma mensagem chega, baixamos e armazenamos os buffers.
 * Assim, quando for deletada, já temos os arquivos prontos.
 */

interface CachedAttachment {
    name: string;
    contentType: string | null;
    buffer: Buffer;
}

// messageId -> lista de anexos em buffer
const attachmentCache = new Map<string, CachedAttachment[]>();

// Limite de entradas no cache para não estourar memória
const MAX_CACHE_SIZE = 500;

export async function cacheMessageAttachments(
    messageId: string,
    attachments: { id: string; url: string; name: string | null; contentType: string | null }[]
): Promise<void> {
    if (attachments.length === 0) return;

    // Limpa entradas antigas se o cache estiver cheio
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
            cached.push({
                name: attachment.name ?? "arquivo",
                contentType: attachment.contentType,
                buffer,
            });
        } catch {
            // ignora falha de download individual
        }
    }

    if (cached.length > 0) {
        attachmentCache.set(messageId, cached);
    }
}

export function getCachedAttachments(messageId: string): CachedAttachment[] {
    return attachmentCache.get(messageId) ?? [];
}

export function deleteCachedAttachments(messageId: string): void {
    attachmentCache.delete(messageId);
}
