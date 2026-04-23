import { createEvent } from "#base";
import { db } from "#database";
import { AuditLogEvent, GuildBan } from "discord.js";

export default createEvent({
    name: "ban-logger",
    event: "guildBanAdd",
    async run(ban: GuildBan) {
        const { guild, user } = ban;

        // Tenta pegar o motivo e quem baniu pelo Audit Log
        let moderatorTag = "Desconhecido";
        let moderatorId = "Desconhecido";
        let reason = "Sem motivo informado";

        try {
            // Pequeno delay para o Audit Log ser registrado
            await new Promise(resolve => setTimeout(resolve, 1500));

            const auditLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 5,
            });

            const banLog = auditLogs.entries.find(
                (entry: any) => entry.target?.id === user.id
            );

            if (banLog && banLog.executor) {
                moderatorTag = banLog.executor.username || "Desconhecido";
                moderatorId = banLog.executor.id;
                reason = banLog.reason || "Sem motivo informado";
            }
        } catch {
            // Se não conseguir acessar o Audit Log, salva mesmo assim
        }

        // Salvando o log de ban no banco de dados
        await db.modlogs.create({
            guildId: guild.id,
            moderatorId,
            moderatorTag,
            targetId: user.id,
            targetTag: user.username,
            action: "BAN",
            reason,
            duration: "Permanente",
        });
        return;
    }
});
