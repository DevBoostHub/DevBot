import { createEvent } from "#base";
import { EmbedBuilder } from "discord.js";
import { getLogsChannel } from "./utils.js";

createEvent({
	name: "Log: entrada e saída em canal de voz",
	event: "voiceStateUpdate",
	async run(oldState, newState) {
		// Ignora bots
		if (newState.member?.user.bot) return;

		const logsChannel = await getLogsChannel(newState.client);
		if (!logsChannel) return;

		// Detecta entrada em canal de voz
		if (!oldState.channel && newState.channel) {
			const embed = new EmbedBuilder()
				.setColor(0x57f287) // Verde
				.setAuthor({
					name: `${newState.member?.user.tag} entrou em um canal de voz`,
					iconURL: newState.member?.user.displayAvatarURL(),
				})
				.addFields(
					{
						name: "🎤 Canal",
						value: `${newState.channel} \`(ID: ${newState.channel.id})\``,
						inline: false,
					},
					{
						name: "👤 Usuário",
						value: `${newState.member} \`(ID: ${newState.member?.id})\``,
						inline: false,
					}
				)
				.setFooter({ text: `ID do usuário: ${newState.member?.id}` })
				.setTimestamp();

			await logsChannel.send({ embeds: [embed] });
		}

		// Detecta saída de canal de voz
		else if (oldState.channel && !newState.channel) {
			const embed = new EmbedBuilder()
				.setColor(0xed4245) // Vermelho
				.setAuthor({
					name: `${newState.member?.user.tag} saiu de um canal de voz`,
					iconURL: newState.member?.user.displayAvatarURL(),
				})
				.addFields(
					{
						name: "🎤 Canal",
						value: `${oldState.channel} \`(ID: ${oldState.channel.id})\``,
						inline: false,
					},
					{
						name: "👤 Usuário",
						value: `${newState.member} \`(ID: ${newState.member?.id})\``,
						inline: false,
					}
				)
				.setFooter({ text: `ID do usuário: ${newState.member?.id}` })
				.setTimestamp();

			await logsChannel.send({ embeds: [embed] });
		}

		// Detecta troca de canal de voz
		else if (oldState.channel?.id !== newState.channel?.id && oldState.channel && newState.channel) {
			const embed = new EmbedBuilder()
				.setColor(0x5865f2) // Azul
				.setAuthor({
					name: `${newState.member?.user.tag} mudou de canal de voz`,
					iconURL: newState.member?.user.displayAvatarURL(),
				})
				.addFields(
					{
						name: "🎤 Canal anterior",
						value: `${oldState.channel} \`(ID: ${oldState.channel.id})\``,
						inline: true,
					},
					{
						name: "🎤 Novo canal",
						value: `${newState.channel} \`(ID: ${newState.channel.id})\``,
						inline: true,
					},
					{
						name: "👤 Usuário",
						value: `${newState.member} \`(ID: ${newState.member?.id})\``,
						inline: false,
					}
				)
				.setFooter({ text: `ID do usuário: ${newState.member?.id}` })
				.setTimestamp();

			await logsChannel.send({ embeds: [embed] });
		}
	},
});
