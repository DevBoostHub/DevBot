import { createEvent } from "#base";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { deleteCachedAttachments, getCachedAttachments } from "./attachmentCache.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: exclusão de mensagem",
    event: "messageDelete",
    async run(message) {
        // Ignora bots
        if (message.author?.bot) return;
        if (!message.guildId) return;

        // Recuperar anexos do cache ANTES de qualquer await
        // (o id sempre existe mesmo em mensagens parciais)
        const cached = getCachedAttachments(message.id);
        deleteCachedAttachments(message.id);

        // Se a mensagem é partial e não tem conteúdo nem anexos cacheados, ignora
        if (message.partial && !message.content && cached.length === 0) return;

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

        const files = cached.map(a => new AttachmentBuilder(a.buffer, { name: a.name }));

        if (cached.length > 0) {
            embed.addFields({
                name:   `📎 Anexo${cached.length > 1 ? "s" : ""} recuperado${cached.length > 1 ? "s" : ""}`,
                value:  cached.map(a => `\`${a.name}\``).join(", "),
                inline: false,
            });
        }

        await logsChannel.send({ embeds: [embed], files });
    },
});
