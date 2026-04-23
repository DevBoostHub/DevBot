import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createRow } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { buildOptionsText, pollStore, totalVotes } from "./store.js";

createResponder({
    customId: "poll/vote/:pollId/:optionId",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({ pollId: params.pollId, optionId: params.optionId }),
    async run(interaction, { pollId, optionId }) {
        const { user, guild } = interaction;

        const poll = pollStore.get(pollId);
        if (!poll || poll.closed) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Esta enquete não está mais disponível." });
            return;
        }

        const optIdx = poll.options.findIndex(o => o.id === optionId);
        if (optIdx === -1) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Opção inválida." });
            return;
        }

        const opt = poll.options[optIdx];

        // ── Single: troca de voto permitida, mas definitivo na mesma opção ─
        if (poll.type === "single") {
            const prevOptionId = poll.votes.get(user.id);

            if (prevOptionId === optionId) {
                await interaction.reply({ flags: ["Ephemeral"], content: "🚫 Você já votou nesta opção." });
                return;
            }

            // Remover voto anterior
            if (prevOptionId !== undefined) {
                const prevIdx = poll.options.findIndex(o => o.id === prevOptionId);
                if (prevIdx !== -1) {
                    poll.options[prevIdx].voteCount = Math.max(0, poll.options[prevIdx].voteCount - 1);
                    poll.options[prevIdx].voters = poll.options[prevIdx].voters.filter(id => id !== user.id);
                }
            }

            poll.votes.set(user.id, optionId);
            opt.voteCount += 1;
            opt.voters.push(user.id);
        }

        // ── Multi: toggle — marca/desmarca por opção ──────────────────────
        if (poll.type === "multi") {
            if (opt.voters.includes(user.id)) {
                // Desmarcar
                opt.voteCount = Math.max(0, opt.voteCount - 1);
                opt.voters = opt.voters.filter(id => id !== user.id);
                poll.votes.delete(`${user.id}:${optionId}`);
            } else {
                // Marcar
                opt.voteCount += 1;
                opt.voters.push(user.id);
                poll.votes.set(`${user.id}:${optionId}`, optionId);
            }
        }

        await interaction.deferUpdate();

        // ── Atualizar embed público ────────────────────────────────────────
        const total     = totalVotes(poll);
        const typeLabel = poll.type === "single" ? "🔘 Uma resposta" : "☑️ Múltipla escolha";
        const typeHint  = poll.type === "single"
            ? "-# 🔘 Selecione uma opção — o voto é definitivo"
            : "-# ☑️ Selecione uma ou mais opções";

        const embed = new EmbedBuilder()
            .setColor(0x313338)
            .setTitle(poll.question)
            .setDescription(`${typeHint}\n\n${buildOptionsText(poll)}`)
            .setFooter({ text: `${typeLabel} · ${total} voto${total !== 1 ? "s" : ""}` })
            .setTimestamp();

        const voteButtons = poll.options.map(o =>
            new ButtonBuilder({ customId: `poll/vote/${pollId}/${o.id}`, label: o.label, style: ButtonStyle.Secondary })
        );

        const rows = [];
        for (let i = 0; i < voteButtons.length; i += 5) rows.push(createRow(...voteButtons.slice(i, i + 5)));

        await interaction.editReply({ embeds: [embed], components: rows });

        // ── Notificar canal privado ────────────────────────────────────────
        if (guild) {
            try {
                const ch = guild.channels.cache.get(poll.resultChannelId);
                if (ch?.isTextBased()) {
                    const resumo = poll.options.map(o => {
                        const pct   = total > 0 ? Math.round((o.voteCount / total) * 100) : 0;
                        const names = o.voters.length > 0
                            ? o.voters.map(id => `<@${id}>`).join(" ")
                            : "*nenhum*";
                        return `**${o.label}** — ${o.voteCount} voto${o.voteCount !== 1 ? "s" : ""} (${pct}%)\n${names}`;
                    }).join("\n\n");

                    await ch.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x57f287)
                                .setTitle("🗳️ Novo voto")
                                .setDescription(`<@${user.id}> votou em **${opt.label}**`)
                                .setThumbnail(user.displayAvatarURL({ size: 64 }))
                                .addFields({ name: "Placar atual", value: resumo })
                                .setTimestamp(),
                        ],
                    });
                }
            } catch { /* ignora erros no canal privado */ }
        }
    },
});
