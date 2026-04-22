import { createEvent } from "#base";

export default createEvent({
    name: "interactionCreate",
    async run(interaction) {
        // Se não for um menu de seleção ou não for o nosso menu de castigo, ignora
        if (!interaction.isStringSelectMenu()) return;
        if (!interaction.customId.startsWith("select_castigo_")) return;

        const { guild } = interaction;
        if (!guild) return;

        // Pegando os dados que salvamos no CustomID (ID do usuário e o Tempo)
        const [, , alvoId, duracaoTexto] = interaction.customId.split("_");
        const motivo = interaction.values[0];

        const alvo = await guild.members.fetch(alvoId).catch(() => null);

        if (!alvo) {
            return interaction.update({ content: "❌ Usuário não encontrado!", components: [] });
        }

        // Convertendo o tempo (m ou h) para milissegundos
        const tempo = parseInt(duracaoTexto);
        const unidade = duracaoTexto.slice(-1).toLowerCase();
        let milissegundos = 0;

        if (unidade === "m") milissegundos = tempo * 60 * 1000;
        else if (unidade === "h") milissegundos = tempo * 60 * 60 * 1000;

        try {
            await alvo.timeout(milissegundos, motivo);
            await interaction.update({
                content: `✅ **${alvo.user.username}** foi castigado!\n**Tempo:** ${duracaoTexto}\n**Motivo:** ${motivo}`,
                components: [] // Remove o menu da tela
            });
        } catch (error) {
            await interaction.update({ content: "❌ Erro ao aplicar castigo. Verifique minhas permissões.", components: [] });
        }
    }
});
