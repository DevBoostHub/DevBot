import { ChannelType, Client, TextChannel } from "discord.js";

const LOG_CHANNEL_ID = "1492663060370952333";

/**
 * Retorna o canal de logs fixo, ou null se não encontrado.
 */
export async function getLogsChannel(client: Client): Promise<TextChannel | null> {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return null;
    return channel as TextChannel;
}
