import { createCommand } from "#base";
import { db } from "#database";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    EmbedBuilder,
} from "discord.js";

createCommand({
    name: "logs",
    description: "Exibe o histórico de castigos e bans do servidor.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["Administrator"],
    options: [
        {
            name: "usuario",
            description: "Filtrar logs de um usuário específico (opcional)",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
        {
            name: "tipo",
            description: "Filtrar por tipo de ação (opcional)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Castigo", value: "CASTIGO" },
                { name: "Ban", value: "BAN" },
            ]
        }
    ],
    async run(interaction) {
        const { guild, options } = interaction;
        if (!guild) return;

        await interaction.deferReply({ flags: ["Ephemeral"] });

        const targetUser = options.getUser("usuario");
        const tipoFiltro = options.getString("tipo");

        // Montando a query
        const query: Record<string, string> = { guildId: guild.id };
        if (targetUser) query.targetId = targetUser.id;
        if (tipoFiltro) query.action = tipoFiltro;

        const logs = await db.modlogs.find(query).sort({ createdAt: -1 }).limit(25);

        if (logs.length === 0) {
            return interaction.editReply({
                content: "📋 Nenhum registro encontrado com os filtros selecionados.",
            });
        }

        // Emojis por tipo de ação
        const actionEmoji: Record<string, string> = {
            CASTIGO: "🔇",
            BAN: "🔨",
        };

        const actionColor: Record<string, number> = {
            CASTIGO: 0xFBBD23,  // Amarelo (warning)
            BAN: 0xED4245,      // Vermelho (danger)
        };

        // Título dinâmico
        let title = "📋 Histórico de Moderação";
        if (targetUser) title += ` — ${targetUser.username}`;
        if (tipoFiltro) title += ` (${tipoFiltro})`;

        // Cor do embed baseada no filtro
        const embedColor = tipoFiltro ? actionColor[tipoFiltro] : 0x5865F2;

        const description = logs.map((log, index) => {
            const emoji = actionEmoji[log.action] ?? "📝";
            const data = log.createdAt
                ? `<t:${Math.floor(new Date(log.createdAt).getTime() / 1000)}:R>`
                : "Data desconhecida";
            const duracao = log.duration ? ` | ⏱️ ${log.duration}` : "";

            return [
                `**${index + 1}.** ${emoji} **${log.action}**${duracao}`,
                `> 👤 Alvo: **${log.targetTag}** (<@${log.targetId}>)`,
                `> 🛡️ Moderador: **${log.moderatorTag}**`,
                `> 📝 Motivo: ${log.reason}`,
                `> 📅 ${data}`,
            ].join("\n");
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(embedColor)
            .setFooter({ text: `Total: ${logs.length} registro(s) encontrado(s)` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
    }
});
