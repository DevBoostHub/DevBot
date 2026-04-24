import { createEvent } from "#base";
import { AuditLogEvent, EmbedBuilder, time } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: saída de membro",
    event: "guildMemberRemove",
    async run(member) {
        if (member.user.bot) return;

        const logsChannel = await getLogsChannel(member.client);
        if (!logsChannel) return;

        // Verifica se foi kick via audit log
        let kickedBy: string | null = null;
        let reason: string | null = null;
        try {
            const audit = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
            const entry = audit.entries.first();
            if (entry && entry.target?.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
                kickedBy = entry.executor ? `${entry.executor.tag} \`(ID: ${entry.executor.id})\`` : "Desconhecido";
                reason = entry.reason ?? "Sem motivo";
            }
        } catch { /* sem permissão */ }

        const embed = new EmbedBuilder()
            .setColor(kickedBy ? 0xff7043 : 0x99aab5)
            .setAuthor({
                name: kickedBy
                    ? `${member.user.tag} foi expulso do servidor`
                    : `${member.user.tag} saiu do servidor`,
                iconURL: member.user.displayAvatarURL(),
            })
            .addFields(
                { name: "👤 Usuário", value: `${member.user} \`(ID: ${member.id})\``, inline: false },
                { name: "📅 Entrou em", value: member.joinedAt ? time(member.joinedAt, "F") : "Desconhecido", inline: false }
            );

        if (kickedBy) {
            embed.addFields(
                { name: "👢 Expulso por", value: kickedBy, inline: false },
                { name: "📋 Motivo", value: reason ?? "Sem motivo", inline: false }
            );
        }

        embed
            .setFooter({ text: `ID do usuário: ${member.id}` })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
