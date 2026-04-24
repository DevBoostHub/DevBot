import { createEvent } from "#base";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { deleteCachedAttachments, getCachedAttachments } from "./attachmentCache.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: exclusão de mensagem",
    event: "messageDelete",
    async run(message) {
        if (message.author?.bot) return;
        if (!message.guild) return;

        const logsChannel = await getLogsChannel(message.client);
        if (!logsChannel) return;

        const user    = message.author;
        const channel = message.channel;

        const embed = new EmbedBuilder()
            .setColor(0xed4245)
            .setAuthor({
                name:    user ? `${user.tag} teve uma mensagem deletada` : "Mensagem deletada",
                iconURL: user?.displayAvatarURL(),
            })
            .addFields(
                {
                    name:   "👤 Usuário",
                    value:  user ? `<@${user.id}> \`(ID: ${user.id})\`` : "*desconhecido*",
                    inline: false,
                },
                {
                    name:   "📝 Canal",
                    value:  `<#${channel.id}> \`(ID: ${channel.id})\``,
                    inline: false,
                },
                {
                    name:   "🗑️ Conteúdo",
                    value:  message.content?.slice(0, 1024) || "*sem conteúdo de texto*",
                    inline: false,
                },
            )
            .setFooter({
                text: buildFooter(user?.id ?? "desconhecido", `ID da mensagem: ${message.id}`),
            })
            .setTimestamp();

        // Recuperar anexos do cache
        const cached = getCachedAttachments(message.id);
        const files  = cached.map(a => new AttachmentBuilder(a.buffer, { name: a.name }));
        deleteCachedAttachments(message.id);

        if (cached.length > 0) {
            embed.addFields({
                name:   "📎 Anexos recuperados",
                value:  cached.map(a => `\`${a.name}\``).join(", "),
                inline: false,
            });
        }

        await logsChannel.send({ embeds: [embed], files });
    },
});
