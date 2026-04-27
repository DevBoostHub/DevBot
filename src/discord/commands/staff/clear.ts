import { createCommand } from "#base";
import { buildFooter, getLogsChannel } from "../../events/logs/logsChannel.js";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    EmbedBuilder,
    PermissionFlagsBits,
} from "discord.js";

createCommand({
    name: "clear",
    description: "🗑️ Apaga mensagens do canal em massa",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    dmPermission: false,
    options: [
        {
            name: "quantidade",
            description: "Número de mensagens a apagar (padrão: 100)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 100,
        },
    ],
    async run(interaction) {
        const { channel, user } = interaction;
        const quantidade = interaction.options.getInteger("quantidade") ?? 100;

        if (!channel || !channel.isTextBased() || !("bulkDelete" in channel)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Este comando só funciona em canais de texto.",
            });
            return;
        }

        await interaction.deferReply({ flags: ["Ephemeral"] });

        try {
            const deleted = await channel.bulkDelete(quantidade, true);
            const count   = deleted.size;

            await interaction.editReply({
                content: `✅ Foram apagadas **${count}** mensagem${count !== 1 ? "s" : ""} deste canal.`,
            });

            // ── Log de auditoria ───────────────────────────────────────────
            const logsChannel = await getLogsChannel(interaction.client);
            if (!logsChannel) return;

            const embed = new EmbedBuilder()
                .setColor(0xff5555)
                .setAuthor({
                    name:    `Chat limpo por ${user.tag}`,
                    iconURL: user.displayAvatarURL(),
                })
                .addFields(
                    { name: "👮 Administrador", value: `<@${user.id}> \`(ID: ${user.id})\``,         inline: false },
                    { name: "🗑️ Canal",         value: `<#${channel.id}> \`(ID: ${channel.id})\``,   inline: false },
                    { name: "📊 Quantidade",    value: `${count} mensagem${count !== 1 ? "s" : ""} apagada${count !== 1 ? "s" : ""}`, inline: false },
                )
                .setFooter({ text: buildFooter(user.id) })
                .setTimestamp();

            await logsChannel.send({ embeds: [embed] });
        } catch (err) {
            console.error("Erro ao apagar mensagens:", err);
            await interaction.editReply({
                content: "❌ Ocorreu um erro ao apagar as mensagens. Verifique as permissões do bot.",
            });
        }
    },
});
