import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { EmbedBuilder } from "discord.js";
import { buildBar, enqueteStore } from "./store.js";

createResponder({
    customId: "/staff/enquete/votar/:enqueteId/:opcao",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({
        enqueteId: params.enqueteId,
        opcao: Number.parseInt(params.opcao),
    }),
    async run(interaction, { enqueteId, opcao }) {
        const { user } = interaction;

        const enquete = enqueteStore.get(enqueteId);
        if (!enquete) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Essa enquete não está mais disponível (o bot pode ter reiniciado).",
            });
            return;
        }

        const opcaoItem = enquete.opcoes[opcao];
        if (!opcaoItem) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Opção inválida.",
            });
            return;
        }

        // ── Tipo "alternativa": remove voto anterior antes de registrar ────
        if (enquete.tipo === "alternativa") {
            for (const o of enquete.opcoes) {
                o.votes.delete(user.id);
            }
            opcaoItem.votes.add(user.id);
        }

        // ── Tipo "checkbox": toggle — marca/desmarca ───────────────────────
        if (enquete.tipo === "checkbox") {
            if (opcaoItem.votes.has(user.id)) {
                opcaoItem.votes.delete(user.id);
            } else {
                opcaoItem.votes.add(user.id);
            }
        }

        // ── Calcular total para porcentagem ────────────────────────────────
        // Alternativa: total = soma de todos os votos
        // Checkbox: total = max votos em uma única opção (evita >100%)
        const totalVotos =
            enquete.tipo === "alternativa"
                ? enquete.opcoes.reduce((sum, o) => sum + o.votes.size, 0)
                : Math.max(...enquete.opcoes.map(o => o.votes.size), 1);

        // ── Atualizar embed ────────────────────────────────────────────────
        const tipoLabel = enquete.tipo === "alternativa"
            ? "🔘 Uma resposta"
            : "☑️ Múltipla escolha";

        const tipoDesc = enquete.tipo === "alternativa"
            ? "🔘 Selecione **uma opção** clicando no botão abaixo."
            : "☑️ Você pode selecionar **múltiplas opções**. Clique novamente para desmarcar.";

        const embed = new EmbedBuilder()
            .setTitle(`📊  ${enquete.pergunta}`)
            .setDescription(tipoDesc)
            .setColor(0x5865f2)
            .setFooter({ text: `Tipo: ${tipoLabel}  •  ID: ${enqueteId}` })
            .setTimestamp()
            .addFields(
                enquete.opcoes.map(o => ({
                    name: o.label,
                    value: buildBar(o.votes.size, totalVotos),
                    inline: false,
                }))
            );

        await interaction.update({ embeds: [embed] });
    },
});
