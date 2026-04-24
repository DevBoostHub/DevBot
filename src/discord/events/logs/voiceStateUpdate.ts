import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { buildFooter, getLogsChannel } from "./logsChannel.js";

createEvent({
    name: "Log: voz",
    event: "voiceStateUpdate",
    async run(oldState, newState) {
        if (newState.member?.user.bot) return;

        const member = newState.member ?? oldState.member;
        if (!member) return;

        const joined = !oldState.channelId && !!newState.channelId;
        const left   = !!oldState.channelId && !newState.channelId;
        const moved  = !!oldState.channelId && !!newState.channelId
                       && oldState.channelId !== newState.channelId;

        // Ignora eventos que não são entrada, saída ou troca (ex: mute/unmute)
        if (!joined && !left && !moved) return;

        const logsChannel = await getLogsChannel(newState.client);
        if (!logsChannel) return;

        const user = member.user;
        let embed: EmbedBuilder;

        if (joined) {
            embed = new EmbedBuilder()
                .setColor(0x57f287)
                .setAuthor({ name: `${user.tag} entrou em um canal de voz`, iconURL: user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário", value: `<@${user.id}> \`(ID: ${user.id})\``,                          inline: false },
                    { name: "🔊 Canal",   value: `${newState.channel} \`(ID: ${newState.channelId})\``, inline: false },
                );
        } else if (left) {
            embed = new EmbedBuilder()
                .setColor(0xed4245)
                .setAuthor({ name: `${user.tag} saiu de um canal de voz`, iconURL: user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário", value: `<@${user.id}> \`(ID: ${user.id})\``,                          inline: false },
                    { name: "🔇 Canal",   value: `${oldState.channel} \`(ID: ${oldState.channelId})\``, inline: false },
                );
        } else {
            embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setAuthor({ name: `${user.tag} mudou de canal de voz`, iconURL: user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário",        value: `<@${user.id}> \`(ID: ${user.id})\``,                          inline: false },
                    { name: "🔇 Canal Anterior", value: `${oldState.channel} \`(ID: ${oldState.channelId})\``, inline: true  },
                    { name: "🔊 Novo Canal",     value: `${newState.channel} \`(ID: ${newState.channelId})\``, inline: true  },
                );
        }

        embed
            .setFooter({ text: buildFooter(user.id) })
            .setTimestamp();

        await logsChannel.send({ embeds: [embed] });
    },
});
