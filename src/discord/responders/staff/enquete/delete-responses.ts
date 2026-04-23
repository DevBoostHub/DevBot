import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { enqueteStore } from "./store.js";

createResponder({
    customId: "/staff/enquete/delete/:enqueteId",
    types: [ResponderType.Button],
    cache: "cached",
    parse: params => ({ enqueteId: params.enqueteId }),
    async run(interaction, { enqueteId }) {
        const { user, guild } = interaction;

        const enquete = enqueteStore.get(enqueteId);
        if (!enquete) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Essa enquete não está mais disponível (o bot pode ter reiniciado).",
            });
            return;
        }

        // Verificar se o usuário é o criador
        if (enquete.criadoPor !== user.id) {
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "🚫 Apenas o **criador** da enquete pode destruir a sala de respostas.",
            });
            return;
        }

        // Deletar canal de respostas
        try {
            if (enquete.responseChannelId && guild) {
                const responseChannel = guild.channels.cache.get(enquete.responseChannelId);
                if (responseChannel) {
                    await responseChannel.delete("Sala de respostas destruída pelo criador");
                }
            }

            // Remover enquete do store
            enqueteStore.delete(enqueteId);

            await interaction.reply({
                flags: ["Ephemeral"],
                content: "🗑️ Sala de respostas **destruída com sucesso**! Todas as respostas foram deletadas.",
            });
        } catch (err) {
            console.error("Erro ao destruir sala de respostas:", err);
            await interaction.reply({
                flags: ["Ephemeral"],
                content: "❌ Erro ao destruir sala de respostas. Tente novamente.",
            });
        }
    },
});
