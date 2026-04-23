import { createCommand } from "#base";
import { createRow } from "@magicyan/discord";
import {
    ApplicationCommandType,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
} from "discord.js";

createCommand({
    name: "enquete",
    description: "📊 Cria uma enquete no canal atual",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    dmPermission: false,
    async run(interaction) {
        const select = new StringSelectMenuBuilder({
            customId: "poll/tipo",
            placeholder: "Selecione o tipo de enquete...",
            options: [
                {
                    value:       "single",
                    label:       "Uma resposta",
                    description: "Cada membro escolhe apenas uma opção",
                    emoji:       { name: "🔘" },
                },
                {
                    value:       "multi",
                    label:       "Múltipla escolha",
                    description: "Cada membro pode marcar mais de uma opção",
                    emoji:       { name: "☑️" },
                },
                {
                    value:       "text",
                    label:       "Resposta por extenso",
                    description: "Cada membro digita uma resposta livre",
                    emoji:       { name: "✏️" },
                },
            ],
        });

        await interaction.reply({
            flags:      ["Ephemeral"],
            content:    "📊 **Nova Enquete** — Selecione o tipo:",
            components: [createRow(select)],
        });
    },
});
