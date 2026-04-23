import { createEvent } from "#base";
import { EmbedBuilder, codeBlock } from "discord.js";
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
                        : "*Sem texto (apenas mídia)*",
                    inline: false,
                }
            )
            .setFooter({
                text: `ID do usuário: ${author?.id ?? "?"} • ID da mensagem: ${message.id}`,
            })
            .setTimestamp();

        // Anexos (imagens, documentos, etc.)
        const attachments = [...message.attachments.values()];
        if (attachments.length > 0) {
            const list = attachments
                .map(a => `• [${a.name}](${a.url}) \`(${a.contentType ?? "desconhecido"})\``)
                .join("\n");
            embed.addFields({
                name: "📎 Anexos excluídos",
                value: list.slice(0, 1024),
                inline: false,
            });
        }

        await logsChannel.send({ embeds: [embed] });
    },
});
