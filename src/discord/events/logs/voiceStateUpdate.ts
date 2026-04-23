import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
    name: "Log: entrada/saída de voz",
    event: "voiceStateUpdate",
    async run(oldState, newState) {
        if (newState.member?.user.bot) return;

        const logsChannel = await getLogsChannel(newState.client);
        if (!logsChannel) return;

        const member = newState.member ?? oldState.member;
        if (!member) return;

        const joined = !oldState.channelId && newState.channelId;
        const left = oldState.channelId && !newState.channelId;
        const moved = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

        let embed: EmbedBuilder | null = null;

        if (joined) {
            embed = new EmbedBuilder()
                .setColor(0x57f287)
                .setAuthor({ name: `${member.user.tag} entrou em um canal de voz`, iconURL: member.user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário", value: `${member} \`(ID: ${member.id})\``, inline: false },
                    { name: "🔊 Canal", value: `${newState.channel} \`(ID: ${newState.channelId})\``, inline: false }
                );
        } else if (left) {
            embed = new EmbedBuilder()
                .setColor(0xed4245)
                .setAuthor({ name: `${member.user.tag} saiu de um canal de voz`, iconURL: member.user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário", value: `${member} \`(ID: ${member.id})\``, inline: false },
                    { name: "🔇 Canal", value: `${oldState.channel} \`(ID: ${oldState.channelId})\``, inline: false }
                );
        } else if (moved) {
            embed = new EmbedBuilder()
                .setColor(0xfee75c)
                .setAuthor({ name: `${member.user.tag} mudou de canal de voz`, iconURL: member.user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário", value: `${member} \`(ID: ${member.id})\``, inline: false },
                    { name: "🔇 Canal anterior", value: `${oldState.channel} \`(ID: ${oldState.channelId})\``, inline: true },
                    { name: "🔊 Novo canal", value: `${newState.channel} \`(ID: ${newState.channelId})\``, inline: true }
                );
        }

        if (!embed) return;

        embed.setFooter({ text: `ID do usuário: ${member.id}` }).setTimestamp();
        await logsChannel.send({ embeds: [embed] });
    },
});
