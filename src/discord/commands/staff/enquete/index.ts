import { createCommand } from "#base";
import { createRow } from "@magicyan/discord";
import {
    ApplicationCommandType,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
} from "discord.js";

createCommand({
    name: "enquete",
    description: "📊 Cria uma enquete no canal atual (somente administradores)",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    dmPermission: false,
    async run(interaction) {
        const { member } = interaction;

        // Verificação dupla em runtime
        if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "🚫 Apenas **administradores** podem usar este comando.",
            });
            return;
        }

        const selectMenu = new StringSelectMenuBuilder({
            customId: "/staff/enquete/tipo",
            placeholder: "Selecione o tipo de enquete...",
            options: [
                {
                    value: "alternativa",
                    label: "Alternativa — uma resposta",
                    description: "Os membros escolhem apenas uma opção",
                    emoji: { name: "🔘" },
                },
                {
                    value: "checkbox",
                    label: "Múltipla escolha — várias respostas",
                    description: "Os membros podem marcar mais de uma opção",
                    emoji: { name: "☑️" },
                },
                {
                    value: "input",
                    label: "Resposta por extenso",
                    description: "Os membros digitam uma resposta livre",
                    emoji: { name: "✏️" },
                },
            ],
        });

        await interaction.reply({
            flags: ["Ephemeral"],
            content: "📊 **Criar Enquete** — Selecione o tipo de enquete:",
            components: [createRow(selectMenu)],
        });
    },
});
