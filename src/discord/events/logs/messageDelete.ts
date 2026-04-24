import { createEvent } from "#base";
import { AttachmentBuilder, EmbedBuilder, codeBlock } from "discord.js";
import { deleteCachedAttachments, getCachedAttachments } from "./cache.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: exclusão de mensagem",
    event: "messageDelete",
    async run(message) {
        if (!message.guild) return;
        if (message.author?.bot) return;

        const logsChannel = await getLogsChannel(message.client);
        if (!logsChannel) return;

        const author = message.author;
        const channel = message.channel;

        // Recupera anexos do cache (baixados no messageCreate)
        const cached = getCachedAttachments(message.id);
        deleteCachedAttachments(message.id);

        const files = cached.map(
            a => new AttachmentBuilder(a.buffer, { name: a.name })
        );

        const embed = new EmbedBuilder()
            .setColor(0xed4245)
            .setAuthor({
                name: `${author?.tag ?? "Usuário desconhecido"} excluiu uma mensagem`,
                iconURL: author?.displayAvatarURL(),
            })
            .addFields(
                {
                    name: "📌 Canal",
                    value: `${channel} \`(ID: ${channel.id})\``,
                    inline: false,
                },
                {
                    name: "🗑️ Conteúdo excluído",
                    value: message.content
                        ? codeBlock(message.content.slice(0, 1000))
                        : "*Sem texto*",
                    inline: false,
                }
            )
            .setFooter({
                text: `ID do usuário: ${author?.id ?? "?"} • ID da mensagem: ${message.id} • ID do canal: ${channel.id}`,
            })
            .setTimestamp();

        if (files.length > 0) {
            embed.addFields({
                name: "📎 Mídias recuperadas",
                value: cached.map(a => `• \`${a.name}\` (${a.contentType ?? "?"})`).join("\n"),
                inline: false,
            });
        } else if (message.attachments.size > 0) {
            embed.addFields({
                name: "📎 Anexos (não cacheados)",
                value: [...message.attachments.values()]
                    .map(a => `• \`${a.name}\` (${a.contentType ?? "?"})`)
                    .join("\n"),
                inline: false,
            });
        }

        await logsChannel.send({ embeds: [embed], files });
    },
});
