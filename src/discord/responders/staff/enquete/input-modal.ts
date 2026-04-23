import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { EmbedBuilder } from "discord.js";
import { enqueteStore } from "./store.js";

createResponder({
    customId: "/staff/enquete/input/modal/:enqueteId",
    types: [ResponderType.Modal, ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({ enqueteId: params.enqueteId }),
    async run(interaction, { enqueteId }) {
        const { fields, user, guild } = interaction;

        try {
            const enquete = enqueteStore.get(enqueteId);
            if (!enquete) {
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: "❌ Essa enquete não está mais disponível (o bot pode ter reiniciado).",
                });
                return;
            }

            const resposta = fields.getTextInputValue("resposta").trim();

            if (!resposta) {
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: "❌ Você precisa fornecer uma resposta válida.",
                });
                return;
            }

            // ── Atualiza ou adiciona resposta do usuário ────────────────────────
            const idx = enquete.respostas.findIndex(r => r.userId === user.id);
            if (idx !== -1) {
                enquete.respostas[idx].texto = resposta;
            } else {
                enquete.respostas.push({
                    userId: user.id,
                    username: user.displayName,
                    texto: resposta,
                });
            }

            const totalRespostas = enquete.respostas.length;
            const jaRespondeu = idx !== -1;

            // ── Postar resposta no canal privado ────────────────────────────────
            if (enquete.responseChannelId && guild) {
                try {
                    const responseChannel = guild.channels.cache.get(enquete.responseChannelId);
                    
                    if (responseChannel && responseChannel.isTextBased()) {
                        const responseEmbed = new EmbedBuilder()
                            .setTitle(jaRespondeu ? "🔄 Resposta Atualizada" : "✅ Nova Resposta")
                            .setDescription(resposta)
                            .setAuthor({
                                name: user.displayName,
                                iconURL: user.displayAvatarURL(),
                            })
                            .setColor(jaRespondeu ? 0xfaa61a : 0x57f287)
                            .setFooter({ text: `Total de respostas: ${totalRespostas}` })
                            .setTimestamp();

                        await responseChannel.send({ embeds: [responseEmbed] });
                    }
                } catch (err) {
                    console.error("Erro ao postar resposta no canal privado:", err);
                    // Continua mesmo se houver erro ao postar, já que a resposta foi registrada
                }
            }

            // ── Confirma para o membro ──────────────────────────────────────────
            const msg = jaRespondeu
                ? "🔄 Sua resposta foi **atualizada** com sucesso!"
                : "✅ Sua resposta foi **registrada** com sucesso!";

            await interaction.reply({
                flags: ["Ephemeral"],
                content: msg,
            });
        } catch (err) {
            console.error("Erro ao processar resposta da enquete:", err);
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Ocorreu um erro ao processar sua resposta. Tente novamente.",
            });
        }
    },
});
