import { createEvent } from "#base";
import { EmbedBuilder, time } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: entrada de membro",
    event: "guildMemberAdd",
    async run(member) {
        if (member.user.bot) return;

        const logsChannel = await getLogsChannel(member.client);
        if (!logsChannel) return;

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({ name: `${member.user.tag} entrou no servidor`, iconURL: member.user.displayAvatarURL() })
            .addFields(
                { name: "👤 Usuário", value: `${member} \`(ID: ${member.id})\``, inline: false },
                { name: "📅 Conta criada em", value: time(member.user.createdAt, "F"), inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `ID do usuário: ${member.id}` })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
