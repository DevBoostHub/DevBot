// ─────────────────────────────────────────────
//  Enquete Store — armazenamento em memória
//  Os dados são perdidos se o bot reiniciar.
//  Para persistência, integrar com MongoDB.
// ─────────────────────────────────────────────

export type TipoEnquete = "alternativa" | "checkbox" | "input";

export interface EnqueteOpcao {
    label: string;
    /** IDs dos usuários que votaram nessa opção */
    votes: Set<string>;
}

export interface EnqueteResposta {
    userId: string;
    username: string;
    texto: string;
}

export interface Enquete {
    id: string;
    pergunta: string;
    tipo: TipoEnquete;
    opcoes: EnqueteOpcao[];
    respostas: EnqueteResposta[]; // usado apenas para tipo "input"
    criadoPor: string;
    channelId: string;
    messageId?: string;
    responseChannelId?: string; // Canal privado para armazenar respostas (apenas para tipo "input")
}

/** Singleton compartilhado entre todos os responders */
export const enqueteStore = new Map<string, Enquete>();

/** Gera um ID curto baseado no timestamp */
export function gerarId(): string {
    return Date.now().toString(36).toUpperCase();
}

/**
 * Monta a barra de progresso visual para votos.
 * @param count - votos nesta opção
 * @param total - total de votos (para alternativa) ou max votos de uma opção (para checkbox)
 */
export function buildBar(count: number, total: number): string {
    if (total === 0 || count === 0) {
        return `\`▱▱▱▱▱▱▱▱▱▱\`  0% **(0 votos)**`;
    }
    const percent = Math.round((count / total) * 100);
    const filled = Math.round(percent / 10);
    const bar = "▰".repeat(filled) + "▱".repeat(10 - filled);
    return `\`${bar}\`  ${percent}% **(${count} voto${count !== 1 ? "s" : ""})**`;
}
