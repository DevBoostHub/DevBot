import { createEvent } from "#base";
import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: remoção de banimento",
    event: "guildBanRemove",
    async run(ban) {
        if (ban.user.bot) return;

        const logsChannel = await getLogsChannel(ban.client);
        if (!logsChannel) return;

        let unbannedBy: string | null = null;
        try {
            const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
            const entry = audit.entries.first();
            if (entry && entry.target?.id === ban.user.id && Date.now() - entry.createdTimestamp < 5000) {
                unbannedBy = entry.executor
                    ? `<@${entry.executor.id}> \`(ID: ${entry.executor.id})\``
                    : "*desconhecido*";
            }
        } catch { /* sem permissão */ }

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({
                name:    `${ban.user.tag} teve o banimento removido`,
                iconURL: ban.user.displayAvatarURL(),
            })
            .addFields(
                { name: "👤 Usuário", value: `<@${ban.user.id}> \`(ID: ${ban.user.id})\``, inline: false },
            );

        if (unbannedBy) {
            embed.addFields({ name: "✅ Desbanido por", value: unbannedBy, inline: false });
        }

        embed
            .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: buildFooter(ban.user.id) })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
