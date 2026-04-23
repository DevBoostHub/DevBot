import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createLabel, createModalFields, createTextInput } from "@magicyan/discord";
import { TextInputStyle } from "discord.js";
import { type TipoEnquete } from "./store.js";

createResponder({
    customId: "/staff/enquete/tipo",
    types: [ResponderType.StringSelect],
    cache: "cached",
    async run(interaction) {
        const tipo = interaction.values[0] as TipoEnquete;
        console.log("📋 Menu de tipo acionado, tipo selecionado:", tipo);

        if (tipo === "input") {
            // Enquete de resposta por extenso — apenas 1 campo no modal
            await interaction.showModal({
                customId: "/staff/enquete/modal/input",
                title: "📊 Criar Enquete — Resposta por Extenso",
                components: createModalFields(
                    createLabel(
                        "Pergunta da enquete",
                        createTextInput({
                            customId: "pergunta",
                            placeholder: "Ex: O que você achou do evento de hoje?",
                            style: TextInputStyle.Paragraph,
                            minLength: 5,
                            maxLength: 200,
                            required: true,
                        })
                    ),
                ),
            });
            return;
        }

        // Para alternativa e checkbox — 2 campos: pergunta + opções
        const titulo =
            tipo === "alternativa"
                ? "📊 Criar Enquete — Alternativa"
                : "📊 Criar Enquete — Múltipla Escolha";

        await interaction.showModal({
            customId: `/staff/enquete/modal/${tipo}`,
            title: titulo,
            components: createModalFields(
                createLabel(
                    "Pergunta da enquete",
                    createTextInput({
                        customId: "pergunta",
                        placeholder: "Ex: Qual é o seu horário preferido para eventos?",
                        style: TextInputStyle.Short,
                        minLength: 5,
                        maxLength: 200,
                        required: true,
                    })
                ),
                createLabel(
                    "Opções (uma por linha, mínimo 2, máximo 5)",
                    createTextInput({
                        customId: "opcoes",
                        placeholder: "Manhã\nTarde\nNoite",
                        style: TextInputStyle.Paragraph,
                        minLength: 3,
                        maxLength: 500,
                        required: true,
                    })
                ),
            ),
        });
    },
});
