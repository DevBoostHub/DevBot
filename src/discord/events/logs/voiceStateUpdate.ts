import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { getLogsChannel } from "./utils.js";

// Debounce: ignora eventos duplicados do mesmo usuário em menos de 1s
const recentEvents = new Map<string, string>();

createEvent({
    name: "Log: entrada/saída de voz",
    event: "voiceStateUpdate",
    async run(oldState, newState) {
        if (newState.member?.user.bot) return;

        const member = newState.member ?? oldState.member;
        if (!member) return;

        const joined = !oldState.channelId && newState.channelId;
        const left   = oldState.channelId && !newState.channelId;
        const moved  = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

        // Ignora eventos que não são entrada, saída ou troca de canal
        if (!joined && !left && !moved) return;

        // Chave única para este evento específico
        const eventKey = `${member.id}:${joined ? "join" : left ? "left" : "move"}:${newState.channelId ?? oldState.channelId}`;

        // Se o mesmo evento já foi processado nos últimos 2s, ignora
        if (recentEvents.get(member.id) === eventKey) return;
        recentEvents.set(member.id, eventKey);
        setTimeout(() => recentEvents.delete(member.id), 2000);

        const logsChannel = await getLogsChannel(newState.client);
        if (!logsChannel) return;

        let embed: EmbedBuilder;

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
        } else {
            embed = new EmbedBuilder()
                .setColor(0xfee75c)
                .setAuthor({ name: `${member.user.tag} mudou de canal de voz`, iconURL: member.user.displayAvatarURL() })
                .addFields(
                    { name: "👤 Usuário", value: `${member} \`(ID: ${member.id})\``, inline: false },
                    { name: "🔇 Canal anterior", value: `${oldState.channel} \`(ID: ${oldState.channelId})\``, inline: true },
                    { name: "🔊 Novo canal", value: `${newState.channel} \`(ID: ${newState.channelId})\``, inline: true }
                );
        }

        embed.setFooter({ text: `ID do usuário: ${member.id}` }).setTimestamp();
        await logsChannel.send({ embeds: [embed] });
    },
});
