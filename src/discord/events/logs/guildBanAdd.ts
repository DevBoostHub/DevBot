import { createEvent } from "#base";
import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: ban de membro",
    event: "guildBanAdd",
    async run(ban) {
        const logsChannel = await getLogsChannel(ban.client);
        if (!logsChannel) return;

        // Tenta buscar quem aplicou o ban via audit log
        let executor = "Desconhecido";
        let reason = ban.reason ?? "Sem motivo";
        try {
            const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
            const entry = audit.entries.first();
            if (entry && entry.target?.id === ban.user.id) {
                executor = entry.executor ? `${entry.executor.tag} \`(ID: ${entry.executor.id})\`` : "Desconhecido";
                reason = entry.reason ?? reason;
            }
        } catch { /* sem permissão de audit log */ }

        const embed = new EmbedBuilder()
            .setColor(0xed4245)
            .setAuthor({ name: `${ban.user.tag} foi banido`, iconURL: ban.user.displayAvatarURL() })
            .addFields(
                { name: "👤 Usuário banido", value: `${ban.user} \`(ID: ${ban.user.id})\``, inline: false },
                { name: "🔨 Banido por", value: executor, inline: false },
                { name: "📋 Motivo", value: reason, inline: false }
            )
            .setFooter({ text: `ID do usuário: ${ban.user.id}` })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
