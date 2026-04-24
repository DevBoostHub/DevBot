import { createEvent } from "#base";
import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: unban de membro",
    event: "guildBanRemove",
    async run(ban) {
        const logsChannel = await getLogsChannel(ban.client);
        if (!logsChannel) return;

        let executor = "Desconhecido";
        try {
            const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
            const entry = audit.entries.first();
            if (entry && entry.target?.id === ban.user.id) {
                executor = entry.executor ? `${entry.executor.tag} \`(ID: ${entry.executor.id})\`` : "Desconhecido";
            }
        } catch { /* sem permissão */ }

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({ name: `${ban.user.tag} teve o ban removido`, iconURL: ban.user.displayAvatarURL() })
            .addFields(
                { name: "👤 Usuário", value: `${ban.user} \`(ID: ${ban.user.id})\``, inline: false },
                { name: "🔓 Desbanido por", value: executor, inline: false }
            )
            .setFooter({ text: `ID do usuário: ${ban.user.id}` })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
