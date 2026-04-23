import { createCommand } from "#base";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

createCommand({
    name: "ban",
    description: "Bane um usuário do servidor com um motivo personalizado.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["BanMembers"],
    options: [
        {
            name: "usuario",
            description: "O usuário que será banido",
            type: ApplicationCommandOptionType.User,
            required: true,
        }
    ],
    async run(interaction) {
        const { options } = interaction;
        const alvo = options.getUser("usuario", true);

        // Campo: Nome do usuário
        const nomeInput = new TextInputBuilder()
            .setCustomId("ban_nome")
            .setLabel("Usuário a ser banido")
            .setStyle(TextInputStyle.Short)
            .setValue(alvo.username)
            .setRequired(true);

        // Campo: Motivo
        const motivoInput = new TextInputBuilder()
            .setCustomId("ban_motivo")
            .setLabel("Motivo do Banimento")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Digite o motivo real do banimento...")
            .setMaxLength(500)
            .setRequired(true);

        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nomeInput);
        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(motivoInput);

        const modal = new ModalBuilder()
            .setCustomId(`modal_ban_${alvo.id}`)
            .setTitle("Confirmar Banimento")
            .addComponents(row1, row2);

        await interaction.showModal(modal);
    }
});
