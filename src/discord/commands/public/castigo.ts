import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, GuildMember, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

createCommand({
    name: "castigo",
    description: "Silencia um usuário com motivos pré-definidos.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "O usuário que será castigado",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "duracao",
            description: "Tempo do castigo (ex: 15m, 1h)",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    async run(interaction) {
        const { options } = interaction;
        const alvo = options.getMember("usuario") as GuildMember;
        const duracao = options.getString("duracao", true);

        // Criando o menu de seleção com os motivos
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_castigo_${alvo.id}_${duracao}`) 
            .setPlaceholder("Selecione o motivo do castigo...")
            .addOptions([
                { label: "SPAM", value: "SPAM" },
                { label: "FLODAR O CHAT", value: "FLODAR O CHAT" },
                { label: "PALAVRÕES", value: "PALAVRÕES" },
            ]);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({
            content: `Selecione o motivo para castigar **${alvo.user.username}**:`,
            components: [row],
            flags: ["Ephemeral"]
        });
    }
});

