import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createLabel, createModalFields, createTextInput } from "@magicyan/discord";
import { TextInputStyle } from "discord.js";
import { enqueteStore } from "./store.js";

createResponder({
    customId: "/staff/enquete/input/:enqueteId",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({ enqueteId: params.enqueteId }),
    async run(interaction, { enqueteId }) {
        const enquete = enqueteStore.get(enqueteId);

        if (!enquete) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Essa enquete não está mais disponível (o bot pode ter reiniciado).",
            });
            return;
        }

        await interaction.showModal({
            customId: `/staff/enquete/input/modal/${enqueteId}`,
            title: "✏️ Responder Enquete",
            components: createModalFields(
                createLabel(
                    enquete.pergunta,
                    createTextInput({
                        customId: "resposta",
                        placeholder: "Digite sua resposta aqui...",
                        style: TextInputStyle.Paragraph,
                        minLength: 1,
                        maxLength: 1000,
                        required: true,
                    })
                ),
            ),
        });
    },
});
