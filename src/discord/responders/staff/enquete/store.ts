// ─────────────────────────────────────────────────────────────────────────────
//  Poll Store — in-memory state
//  Dados perdidos ao reiniciar o bot. Para persistência, integrar com MongoDB.
// ─────────────────────────────────────────────────────────────────────────────

export type PollType = "single" | "multi" | "text";

export interface PollOption {
    id:        string;   // índice como string "0","1",...
    label:     string;
    voteCount: number;
    voters:    string[]; // userIds
}

export interface Poll {
    id:          string;
    guildId:     string;
    channelId:   string;
    messageId:   string;
    resultChannelId: string;   // canal privado de resultados
    createdBy:   string;       // userId do criador
    question:    string;
    type:        PollType;
    options:     PollOption[];
    /** userId → optionId  (para tipo "single": troca de voto) */
    votes:       Map<string, string>;
    closed:      boolean;
}

export const pollStore = new Map<string, Poll>();

let _seq = 0;
export function generateId(): string {
    return `${Date.now().toString(36).toUpperCase()}${(++_seq).toString(36)}`;
}

// ── Helpers de renderização ───────────────────────────────────────────────────

const BAR_LEN = 18;

export function buildBar(count: number, total: number): string {
    const pct    = total > 0 ? Math.round((count / total) * 100) : 0;
    const filled = Math.round((pct / 100) * BAR_LEN);
    const bar    = "█".repeat(filled) + "░".repeat(BAR_LEN - filled);
    return `\`${bar}\` **${pct}%**`;
}

export function totalVotes(poll: Poll): number {
    return poll.type === "single"
        ? poll.votes.size
        : poll.options.reduce((s, o) => s + o.voteCount, 0);
}

export function buildOptionsText(poll: Poll, closed = false): string {
    const total = totalVotes(poll);
    const max   = Math.max(...poll.options.map(o => o.voteCount), 0);

    return poll.options.map(opt => {
        const pct     = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
        const filled  = Math.round((pct / 100) * BAR_LEN);
        const bar     = "█".repeat(filled) + "░".repeat(BAR_LEN - filled);
        const crown   = closed && opt.voteCount === max && max > 0 ? " 🏆" : "";
        const votes   = opt.voteCount === 1 ? "1 voto" : `${opt.voteCount} votos`;
        return `**${opt.label}**${crown}\n\`${bar}\` **${pct}%** · *${votes}*`;
    }).join("\n\n");
}

// ── Snapshot pós-encerramento (para o botão "Ver Votação") ───────────────────
export interface PollSnapshot {
    question:    string;
    type:        PollType | "text";
    total:       number;
    /** userId → resposta (apenas para type === "text") */
    textAnswers: Map<string, string>;
    options:     Array<{
        label:     string;
        voteCount: number;
        percent:   number;
        voters:    string[];
        isWinner:  boolean;
    }>;
}
export const snapshotStore = new Map<string, PollSnapshot>();
