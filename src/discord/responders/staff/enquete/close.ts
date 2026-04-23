import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createRow } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { buildOptionsText, pollStore, snapshotStore, totalVotes } from "./store.js";

createResponder({
    customId: "poll/close/:pollId",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({ pollId: params.pollId }),
    async run(interaction, { pollId }) {
        const { user, guild } = interaction;

        const poll = pollStore.get(pollId);
        if (!poll) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Enquete não encontrada." });
            return;
        }
        if (poll.closed) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Esta enquete já foi encerrada." });
            return;
        }
        if (poll.createdBy !== user.id) {
            await interaction.reply({ flags: ["Ephemeral"], content: "🚫 Apenas o criador da enquete pode encerrá-la." });
            return;
        }

        await interaction.deferUpdate();

        poll.closed = true;

        // ── Calcular resultado ─────────────────────────────────────────────
        const total    = poll.type === "text" ? poll.votes.size : totalVotes(poll);
        const maxVotes = Math.max(...poll.options.map(o => o.voteCount), 0);
        const winners  = poll.options.filter(o => o.voteCount === maxVotes && maxVotes > 0);

        let resultLine: string;
        if (poll.type === "text") {
            resultLine = total === 0
                ? "📭 Nenhuma resposta registrada."
                : `📬 **${total}** resposta${total !== 1 ? "s" : ""} recebida${total !== 1 ? "s" : ""}.`;
        } else if (maxVotes === 0) {
            resultLine = "📭 Nenhum voto registrado.";
        } else if (winners.length > 1) {
            resultLine = `🤝 **Empate!** ${winners.map(w => `**${w.label}**`).join(" e ")}`;
        } else {
            const pct  = Math.round((winners[0].voteCount / total) * 100);
            resultLine = `🏆 **${winners[0].label}** venceu com **${pct}%** dos votos`;
        }

        // ── Salvar snapshot ────────────────────────────────────────────────
        snapshotStore.set(pollId, {
            question:    poll.question,
            type:        poll.type,
            total,
            textAnswers: poll.type === "text" ? new Map(poll.votes) : new Map(),
            options: poll.options
                .slice()
                .sort((a, b) => b.voteCount - a.voteCount)
                .map(o => ({
                    label:     o.label,
                    voteCount: o.voteCount,
                    percent:   total > 0 ? Math.round((o.voteCount / total) * 100) : 0,
                    voters:    o.voters,
                    isWinner:  o.voteCount === maxVotes && maxVotes > 0,
                })),
        });

        // ── Embed de resultado ─────────────────────────────────────────────
        const isText = poll.type === "text";
        const resultEmbed = new EmbedBuilder()
            .setColor(isText ? 0x5865f2 : maxVotes > 0 ? 0x248046 : 0x80848e)
            .setTitle(`📊 Resultado — ${poll.question}`)
            .setDescription(isText
                ? resultLine
                : `${resultLine}\n\n${buildOptionsText(poll, true)}`
            )
            .setFooter({
                text: `Encerrada por ${user.displayName} · ${total} ${isText ? `resposta${total !== 1 ? "s" : ""}` : `voto${total !== 1 ? "s" : ""}`}`,
                iconURL: user.displayAvatarURL(),
            })
            .setTimestamp();

        const viewBtn = new ButtonBuilder({
            customId: `poll/voters/${pollId}`,
            label:    isText ? "Ver Minha Resposta" : "Ver Votação",
            style:    ButtonStyle.Secondary,
            emoji:    isText ? "✏️" : "👥",
        });

        // ── Editar mensagem original (remove botões) ───────────────────────
        if (poll.channelId && poll.messageId) {
            try {
                const pubChannel = guild.channels.cache.get(poll.channelId);
                if (pubChannel?.isTextBased()) {
                    const original = await pubChannel.messages.fetch(poll.messageId);
                    await original.edit({ components: [] });
                }
            } catch { /* ignora */ }
        }

        // ── Enviar NOVA mensagem de resultado no canal público ─────────────
        if (poll.channelId) {
            try {
                const pubChannel = guild.channels.cache.get(poll.channelId);
                if (pubChannel?.isTextBased()) {
                    await pubChannel.send({
                        embeds:     [resultEmbed],
                        components: [createRow(viewBtn)],
                    });
                }
            } catch { /* ignora */ }
        }

        // ── Deletar canal privado ──────────────────────────────────────────
        try {
            const ch = guild.channels.cache.get(poll.resultChannelId);
            if (ch) await ch.delete("Enquete encerrada");
        } catch { /* ignora */ }

        pollStore.delete(pollId);

        // Confirmar no canal privado (que vai ser deletado logo)
        await interaction.editReply({
            embeds:     [],
            components: [],
            content:    "✅ Enquete encerrada! O resultado foi publicado no canal.",
        });
    },
});
