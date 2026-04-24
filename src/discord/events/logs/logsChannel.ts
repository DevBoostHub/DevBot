import { ChannelType, Client, TextChannel } from "discord.js";

export const LOGS_CHANNEL_ID = "1492663060370952333";

export async function getLogsChannel(client: Client): Promise<TextChannel | null> {
    try {
        const channel = await client.channels.fetch(LOGS_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) return null;
        return channel as TextChannel;
    } catch {
        return null;
    }
}

/** Monta o footer padrão: "ID do usuário: XXXX • ID do servidor: XXXX" */
export function buildFooter(userId: string, extra?: string): string {
    return `ID do usuário: ${userId}${extra ? ` • ${extra}` : ""}`;
}
