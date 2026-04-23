import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import {
    ActionRowBuilder,
    EmbedBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import { pollStore } from "./store.js";

// Botão "Responder" → abre modal de texto livre
createResponder({
    customId: "poll/reply/:pollId",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({ pollId: params.pollId }),
    async run(interaction, { pollId }) {
        const { user } = interaction;
        const poll = pollStore.get(pollId);
        if (!poll || poll.closed) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Esta enquete não está mais disponível." });
            return;
        }
        if (poll.votes.has(user.id)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "🚫 Você já respondeu esta enquete." });
            return;
        }

        await interaction.showModal({
            customId:   `poll/reply/modal/${pollId}`,
            title:      "✏️ Sua Resposta",
            components: [
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId("answer")
                        .setLabel(poll.question.slice(0, 45))
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("Digite sua resposta aqui...")
                        .setMinLength(1)
                        .setMaxLength(1000)
                        .setRequired(true)
                ),
            ],
        });
    },
});

// Modal de resposta por extenso → salva e notifica canal privado
createResponder({
    customId: "poll/reply/modal/:pollId",
    types: [ResponderType.Modal, ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({ pollId: params.pollId }),
    async run(interaction, { pollId }) {
        const { user, guild, fields } = interaction;

        const poll = pollStore.get(pollId);
        if (!poll || poll.closed) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ Esta enquete não está mais disponível." });
            return;
        }
        if (poll.votes.has(user.id)) {
            await interaction.reply({ flags: ["Ephemeral"], content: "🚫 Você já respondeu esta enquete." });
            return;
        }

        const answer = fields.getTextInputValue("answer").trim();
        if (!answer) {
            await interaction.reply({ flags: ["Ephemeral"], content: "❌ A resposta não pode estar vazia." });
            return;
        }

        // Registrar resposta
        poll.votes.set(user.id, answer);
        const total = poll.votes.size;

        // Atualizar embed público com contagem
        if (poll.channelId && poll.messageId) {
            try {
                const pubChannel = guild.channels.cache.get(poll.channelId);
                if (pubChannel?.isTextBased()) {
                    const msg = await pubChannel.messages.fetch(poll.messageId);
                    const oldEmbed = msg.embeds[0];
                    const newEmbed = EmbedBuilder.from(oldEmbed)
                        .setDescription(
                            `-# ✏️ Clique em **Responder** para enviar sua resposta\n\n` +
                            `📬 **${total} resposta${total !== 1 ? "s" : ""} recebida${total !== 1 ? "s" : ""}**`
                        );
                    await msg.edit({ embeds: [newEmbed] });
                }
            } catch { /* ignora */ }
        }

        // Postar resposta no canal privado (só o admin vê)
        if (poll.resultChannelId) {
            try {
                const ch = guild.channels.cache.get(poll.resultChannelId);
                if (ch?.isTextBased()) {
                    await ch.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x57f287)
                                .setTitle("✅ Nova Resposta")
                                .setDescription(answer)
                                .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
                                .setFooter({ text: `Total: ${total} resposta${total !== 1 ? "s" : ""}` })
                                .setTimestamp(),
                        ],
                    });
                }
            } catch { /* ignora */ }
        }

        await interaction.reply({
            flags:   ["Ephemeral"],
            content: "✅ Sua resposta foi registrada! Apenas o administrador pode ver o conteúdo.",
        });
    },
});
