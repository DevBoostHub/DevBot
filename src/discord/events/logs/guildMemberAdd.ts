import { createEvent } from "#base";
import { EmbedBuilder, time } from "discord.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

// Debounce: evita log duplicado para o mesmo membro em 3s
const recentJoins = new Set<string>();

createEvent({
    name: "Log: entrada de membro",
    event: "guildMemberAdd",
    async run(member) {
        if (member.user.bot) return;
        if (recentJoins.has(member.id)) return;

        recentJoins.add(member.id);
        setTimeout(() => recentJoins.delete(member.id), 3000);

        const logsChannel = await getLogsChannel(member.client);
        if (!logsChannel) return;

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({
                name:    `${member.user.tag} entrou no servidor`,
                iconURL: member.user.displayAvatarURL(),
            })
            .addFields(
                { name: "👤 Usuário",         value: `<@${member.id}> \`(ID: ${member.id})\``,      inline: false },
                { name: "📅 Conta criada em", value: time(member.user.createdAt, "F"),               inline: false },
            )
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: buildFooter(member.id) })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
