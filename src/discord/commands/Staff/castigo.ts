import { createCommand } from "#base";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    GuildMember,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

createCommand({
    name: "castigo",
    description: "Silencia um usuário com um motivo personalizado.",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["ModerateMembers"],
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

        // Campo: Nome do usuário (já preenchido, somente leitura visual)
        const nomeInput = new TextInputBuilder()
            .setCustomId("castigo_nome")
            .setLabel("Nome")
            .setStyle(TextInputStyle.Short)
            .setValue(alvo.user.username)
            .setRequired(true);

        // Campo: Tempo do castigo (já preenchido)
        const tempoInput = new TextInputBuilder()
            .setCustomId("castigo_tempo")
            .setLabel("Tempo")
            .setStyle(TextInputStyle.Short)
            .setValue(duracao)
            .setRequired(true);

        // Campo: Motivo (livre para digitar)
        const motivoInput = new TextInputBuilder()
            .setCustomId("castigo_motivo")
            .setLabel("Motivo")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Digite o motivo do castigo...")
            .setMaxLength(180)
            .setRequired(true);

        // Montando as rows do modal (cada TextInput precisa de sua própria ActionRow)
        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nomeInput);
        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(tempoInput);
        const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(motivoInput);

        // Criando o Modal
        const modal = new ModalBuilder()
            .setCustomId(`modal_castigo_${alvo.id}_${duracao}`)
            .setTitle("Formulário de Castigo")
            .addComponents(row1, row2, row3);

        await interaction.showModal(modal);
    }
});
