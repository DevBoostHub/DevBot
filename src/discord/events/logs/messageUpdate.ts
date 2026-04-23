import { createEvent } from "#base";
import { EmbedBuilder, codeBlock } from "discord.js";
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
                        : "*Conteúdo indisponível*",
                    inline: false,
                },
                {
                    name: "✏️ Nova mensagem",
                    value: newMessage.content
                        ? codeBlock(newMessage.content.slice(0, 1000))
                        : "*Conteúdo indisponível*",
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

        await logsChannel.send({ embeds: [embed] });
    },
});
