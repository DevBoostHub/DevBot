import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: alteração de nickname e avatar",
    event: "guildMemberUpdate",
    async run(oldMember, newMember) {
        if (newMember.user.bot) return;

        const logsChannel = await getLogsChannel(newMember.client);
        if (!logsChannel) return;

        const nicknameChanged = oldMember.nickname !== newMember.nickname;
        const avatarChanged = oldMember.user.avatar !== newMember.user.avatar;

        // --- Alteração de nickname ---
        if (nicknameChanged) {
            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setAuthor({
                    name: `${newMember.user.tag} alterou o apelido`,
                    iconURL: newMember.user.displayAvatarURL(),
                })
                .addFields(
                    {
                        name: "👤 Usuário",
                        value: `${newMember} \`(ID: ${newMember.id})\``,
                        inline: false,
                    },
                    {
                        name: "📛 Apelido anterior",
                        value: oldMember.nickname ?? `*${oldMember.user.username} (sem apelido)*`,
                        inline: true,
                    },
                    {
                        name: "📛 Novo apelido",
                        value: newMember.nickname ?? `*${newMember.user.username} (sem apelido)*`,
                        inline: true,
                    }
                )
                .setFooter({ text: `ID do usuário: ${newMember.id}` })
                .setTimestamp();

            await logsChannel.send({ embeds: [embed] });
        }

        // --- Alteração de avatar ---
        if (avatarChanged) {
            const oldAvatar = oldMember.user.avatar
                ? oldMember.user.displayAvatarURL({ size: 256 })
                : null;
            const newAvatar = newMember.user.displayAvatarURL({ size: 256 });

            const embed = new EmbedBuilder()
                .setColor(0xeb459e)
                .setAuthor({
                    name: `${newMember.user.tag} alterou o avatar`,
                    iconURL: newAvatar,
                })
                .addFields(
                    {
                        name: "👤 Usuário",
                        value: `${newMember} \`(ID: ${newMember.id})\``,
                        inline: false,
                    },
                    {
                        name: "🖼️ Avatar anterior",
                        value: oldAvatar
                            ? `[Ver avatar antigo](${oldAvatar})`
                            : "*Sem avatar anterior*",
                        inline: true,
                    },
                    {
                        name: "🖼️ Novo avatar",
                        value: `[Ver novo avatar](${newAvatar})`,
                        inline: true,
                    }
                )
                .setThumbnail(newAvatar)
                .setImage(oldAvatar)
                .setFooter({ text: `ID do usuário: ${newMember.id}` })
                .setTimestamp();

            await logsChannel.send({ embeds: [embed] });
        }
    },
});
