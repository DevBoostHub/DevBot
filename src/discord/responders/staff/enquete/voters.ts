import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { EmbedBuilder } from "discord.js";
import { snapshotStore } from "./store.js";

createResponder({
    customId: "poll/voters/:pollId",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({ pollId: params.pollId }),
    async run(interaction, { pollId }) {
        const { user } = interaction;

        const snap = snapshotStore.get(pollId);
        if (!snap) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Dados desta enquete não estão mais disponíveis." });
            return;
        }

        // ── Resposta por extenso: mostra só a resposta do próprio usuário ──
        if (snap.type === "text") {
            const answer = snap.textAnswers.get(user.id);
            if (!answer) {
                await interaction.reply({
                    flags:   ["Ephemeral"],
                    content: "📭 Você não enviou uma resposta para esta enquete.",
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(`✏️ Sua Resposta — ${snap.question}`)
                .setDescription(answer)
                .setFooter({ text: "Apenas você pode ver esta resposta." })
                .setTimestamp();

            await interaction.reply({ flags: ["Ephemeral"], embeds: [embed] });
            return;
        }

        // ── Alternativa / Múltipla escolha: lista completa de votantes ─────
        const fields = snap.options.map(o => ({
            name:   `${o.isWinner ? "🏆 " : ""}${o.label} — ${o.voteCount} voto${o.voteCount !== 1 ? "s" : ""} (${o.percent}%)`,
            value:  o.voters.length > 0 ? o.voters.map(id => `<@${id}>`).join(" ") : "*nenhum voto*",
            inline: false,
        }));

        const embed = new EmbedBuilder()
            .setColor(0x313338)
            .setTitle(`👥 Votação — ${snap.question}`)
            .setDescription(`**${snap.total}** participante${snap.total !== 1 ? "s" : ""} · 🔒 Encerrada`)
            .addFields(fields)
            .setTimestamp();

        await interaction.reply({ flags: ["Ephemeral"], embeds: [embed] });
    },
});
