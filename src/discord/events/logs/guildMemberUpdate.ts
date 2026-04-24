import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: atualização de membro",
    event: "guildMemberUpdate",
    async run(oldMember, newMember) {
        if (newMember.user.bot) return;

        const nicknameChanged = oldMember.nickname !== newMember.nickname;
        const avatarChanged   = oldMember.avatar !== newMember.avatar;

        if (!nicknameChanged && !avatarChanged) return;

        const logsChannel = await getLogsChannel(newMember.client);
        if (!logsChannel) return;

        const user  = newMember.user;
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({ name: `${user.tag} atualizou o perfil`, iconURL: user.displayAvatarURL() })
            .addFields({
                name:   "👤 Usuário",
                value:  `<@${user.id}> \`(ID: ${user.id})\``,
                inline: false,
            })
            .setFooter({ text: buildFooter(user.id) })
            .setTimestamp();

        if (nicknameChanged) {
            embed.addFields(
                {
                    name:   "📛 Nickname Anterior",
                    value:  oldMember.nickname ?? "*nenhum*",
                    inline: true,
                },
                {
                    name:   "📛 Novo Nickname",
                    value:  newMember.nickname ?? "*nenhum*",
                    inline: true,
                },
            );
        }

        if (avatarChanged) {
            const oldAvatar = oldMember.displayAvatarURL({ size: 256 });
            const newAvatar = newMember.displayAvatarURL({ size: 256 });
            embed.addFields(
                { name: "🖼️ Avatar Anterior", value: `[Ver avatar antigo](${oldAvatar})`, inline: true },
                { name: "🖼️ Novo Avatar",     value: `[Ver novo avatar](${newAvatar})`,   inline: true },
            );
            embed.setThumbnail(newAvatar).setImage(oldAvatar);
        }

        await logsChannel.send({ embeds: [embed] });
    },
});
