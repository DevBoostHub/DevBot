import { createEvent } from "#base";
import { AttachmentBuilder, EmbedBuilder, codeBlock } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: edição de mensagem",
    event: "messageUpdate",
    async run(oldMessage, newMessage) {
        if (!newMessage.guild) return;
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const logsChannel = await getLogsChannel(newMessage.client);
        if (!logsChannel) return;

        const author = newMessage.author;
        const channel = newMessage.channel;

        // Anexos que existiam na mensagem antiga mas foram removidos na edição
        const removedAttachments = [...oldMessage.attachments.values()].filter(
            a => !newMessage.attachments.has(a.id)
        );

        const embed = new EmbedBuilder()
            .setColor(0xfee75c)
            .setAuthor({
                name: `${author?.tag ?? "Usuário desconhecido"} editou uma mensagem`,
                iconURL: author?.displayAvatarURL(),
            })
            .addFields(
                {
                    name: "📌 Canal",
                    value: `${channel} \`(ID: ${channel.id})\``,
                    inline: false,
                },
                {
                    name: "📝 Mensagem antiga",
                    value: oldMessage.content
                        ? codeBlock(oldMessage.content.slice(0, 1000))
                        : "*Sem texto*",
                    inline: false,
                },
                {
                    name: "✏️ Nova mensagem",
                    value: newMessage.content
                        ? codeBlock(newMessage.content.slice(0, 1000))
                        : "*Sem texto*",
                    inline: false,
                },
                {
                    name: "🔗 Ir para a mensagem",
                    value: `[Clique aqui](${newMessage.url})`,
                    inline: false,
                }
            )
            .setFooter({
                text: `ID do usuário: ${author?.id ?? "?"} • ID da mensagem: ${newMessage.id}`,
            })
            .setTimestamp();

        // Tenta recuperar anexos removidos na edição
        const files: AttachmentBuilder[] = [];

        for (const attachment of removedAttachments) {
            try {
                const response = await fetch(attachment.url);
                if (!response.ok) continue;

                const buffer = Buffer.from(await response.arrayBuffer());
                files.push(new AttachmentBuilder(buffer, { name: attachment.name ?? "arquivo" }));
            } catch {
                // ignora se não conseguir baixar
            }
        }

        if (files.length > 0) {
            embed.addFields({
                name: "📎 Mídias removidas na edição",
                value: `${files.length} arquivo(s) recuperado(s) abaixo`,
                inline: false,
            });
        }

        await logsChannel.send({ embeds: [embed], files });
    },
});
