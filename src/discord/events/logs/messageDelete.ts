import { createEvent } from "#base";
import { AttachmentBuilder, EmbedBuilder, codeBlock } from "discord.js";
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
        const attachments = [...message.attachments.values()];

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

        // Tenta baixar e reenviar os arquivos como anexos reais
        const files: AttachmentBuilder[] = [];

        for (const attachment of attachments) {
            try {
                const response = await fetch(attachment.url);
                if (!response.ok) continue;

                const buffer = Buffer.from(await response.arrayBuffer());
                files.push(new AttachmentBuilder(buffer, { name: attachment.name ?? "arquivo" }));
            } catch {
                // Se não conseguir baixar, apenas lista o nome
            }
        }

        // Se tiver arquivos que não conseguimos baixar, lista no embed
        const failedAttachments = attachments.filter(
            (_, i) => !files[i]
        );
        if (failedAttachments.length > 0) {
            embed.addFields({
                name: "📎 Anexos (não recuperados)",
                value: failedAttachments.map(a => `• ${a.name ?? "arquivo"} \`(${a.contentType ?? "?"})\``).join("\n"),
                inline: false,
            });
        }

        if (files.length > 0) {
            embed.addFields({
                name: "📎 Mídias recuperadas",
                value: `${files.length} arquivo(s) anexado(s) abaixo`,
                inline: false,
            });
        }

        await logsChannel.send({ embeds: [embed], files });
    },
});
