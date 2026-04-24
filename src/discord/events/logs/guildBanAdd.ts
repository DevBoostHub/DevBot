import { createEvent } from "#base";
import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: banimento",
    event: "guildBanAdd",
    async run(ban) {
        if (ban.user.bot) return;

        const logsChannel = await getLogsChannel(ban.client);
        if (!logsChannel) return;

        let bannedBy: string | null = null;
        let reason = ban.reason ?? "*sem motivo*";
        try {
            const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
            const entry = audit.entries.first();
            if (entry && entry.target?.id === ban.user.id && Date.now() - entry.createdTimestamp < 5000) {
                bannedBy = entry.executor
                    ? `<@${entry.executor.id}> \`(ID: ${entry.executor.id})\``
                    : "*desconhecido*";
                reason = entry.reason ?? reason;
            }
        } catch { /* sem permissão */ }

        const embed = new EmbedBuilder()
            .setColor(0xb00020)
            .setAuthor({
                name:    `${ban.user.tag} foi banido do servidor`,
                iconURL: ban.user.displayAvatarURL(),
            })
            .addFields(
                { name: "👤 Usuário",   value: `<@${ban.user.id}> \`(ID: ${ban.user.id})\``, inline: false },
                { name: "📋 Motivo",    value: reason,                                        inline: false },
            );

        if (bannedBy) {
            embed.addFields({ name: "🔨 Banido por", value: bannedBy, inline: false });
        }

        embed
            .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: buildFooter(ban.user.id) })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
