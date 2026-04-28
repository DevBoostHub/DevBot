import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: edição de mensagem",
    event: "messageUpdate",
    async run(oldMessage, newMessage) {
        if (newMessage.author?.bot) return;
        if (!newMessage.guild) return;

        // Ignora se o conteúdo não mudou (ex: embed carregando)
        if (oldMessage.content === newMessage.content) return;

        const logsChannel = await getLogsChannel(newMessage.client);
        if (!logsChannel) return;

        const user    = newMessage.author;
        const channel = newMessage.channel;

        const embed = new EmbedBuilder()
            .setColor(0xfee75c)
            .setAuthor({
                name:    `${user.tag} editou uma mensagem`,
                iconURL: user.displayAvatarURL(),
            })
            .addFields(
                {
                    name:   "👤 Usuário",
                    value:  `<@${user.id}> \`(ID: ${user.id})\``,
                    inline: false,
                },
                {
                    name:   "📝 Canal",
                    value:  `<#${channel.id}> \`(ID: ${channel.id})\``,
                    inline: false,
                },
                {
                    name:   "📄 Mensagem Antiga",
                    value:  oldMessage.content?.slice(0, 1024) || "*sem conteúdo*",
                    inline: false,
                },
                {
                    name:   "✏️ Mensagem Editada",
                    value:  newMessage.content?.slice(0, 1024) || "*sem conteúdo*",
                    inline: false,
                },
            )
            .setFooter({ text: buildFooter(user.id, `ID da mensagem: ${newMessage.id}`) })
            .setTimestamp();

        if (newMessage.url) {
            embed.addFields({ name: "🔗 Link", value: `[Ir para a mensagem](${newMessage.url})`, inline: false });
        }

        await logsChannel.send({ embeds: [embed] });
    },
});
