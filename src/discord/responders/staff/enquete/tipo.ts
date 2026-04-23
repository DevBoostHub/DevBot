import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import {
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import type { PollType } from "./store.js";

function textInput(customId: string, label: string, style: TextInputStyle, placeholder: string, opts?: { min?: number; max?: number }) {
    return new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(style)
            .setPlaceholder(placeholder)
            .setMinLength(opts?.min ?? 1)
            .setMaxLength(opts?.max ?? 200)
            .setRequired(true)
    );
}

createResponder({
    customId: "poll/tipo",
    types: [ResponderType.StringSelect],
    cache: "cached",
    async run(interaction) {
        const type = interaction.values[0] as PollType;

        if (type === "text") {
            await interaction.showModal({
                customId:   "poll/modal/text",
                title:      "✏️ Enquete — Resposta por Extenso",
                components: [
                    textInput("question", "Qual é a pergunta?", TextInputStyle.Paragraph,
                        "Ex: O que você achou do evento?", { min: 3, max: 200 }),
                ],
            });
            return;
        }

        const title = type === "single"
            ? "🔘 Enquete — Uma Resposta"
            : "☑️ Enquete — Múltipla Escolha";

        await interaction.showModal({
            customId:   `poll/modal/${type}`,
            title,
            components: [
                textInput("question", "Qual é a pergunta?", TextInputStyle.Short,
                    "Ex: Qual horário preferem para o evento?", { min: 3, max: 200 }),
                textInput("options", "Opções (uma por linha, mín. 2, máx. 5)", TextInputStyle.Paragraph,
                    "Manhã\nTarde\nNoite", { min: 3, max: 400 }),
            ],
        });
    },
});
