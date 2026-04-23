import { createEvent } from "#base";
import { db } from "#database";
import { Interaction } from "discord.js";

export default createEvent({
    name: "castigo-modal-handler",
    event: "interactionCreate",
    async run(interaction: Interaction) {
        // Se não for um modal submit ou não for o nosso modal de castigo, ignora
        if (!interaction.isModalSubmit()) return;
        
        if (interaction.customId.startsWith("modal_castigo_")) {
            await handleCastigoModal(interaction);
        } else if (interaction.customId.startsWith("modal_ban_")) {
            await handleBanModal(interaction);
        }
    }
});

async function handleCastigoModal(interaction: any) {
    const { guild } = interaction;
    if (!guild) return;

    const [, , alvoId, duracaoTexto] = interaction.customId.split("_");
    const motivo = interaction.fields.getTextInputValue("castigo_motivo");

    const alvo = await guild.members.fetch(alvoId).catch(() => null);

    if (!alvo) {
        await interaction.reply({ content: "❌ Usuário não encontrado!", flags: ["Ephemeral"] });
        return;
    }

    const tempo = parseInt(duracaoTexto);
    const unidade = duracaoTexto.slice(-1).toLowerCase();
    let milissegundos = 0;

    if (unidade === "m") milissegundos = tempo * 60 * 1000;
    else if (unidade === "h") milissegundos = tempo * 60 * 60 * 1000;

    try {
        await alvo.timeout(milissegundos, motivo);

        await db.modlogs.create({
            guildId: guild.id,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.username,
            targetId: alvo.id,
            targetTag: alvo.user.username,
            action: "CASTIGO",
            reason: motivo,
            duration: duracaoTexto,
        });

        await interaction.reply({
            content: `✅ **${alvo.user.username}** foi castigado!\n**Tempo:** ${duracaoTexto}\n**Motivo:** ${motivo}\n📋 Log registrado com sucesso!`,
            flags: ["Ephemeral"]
        });
    } catch (error) {
        await interaction.reply({ content: "❌ Erro ao aplicar castigo. Verifique minhas permissões.", flags: ["Ephemeral"] });
    }
}

async function handleBanModal(interaction: any) {
    const { guild } = interaction;
    if (!guild) return;

    const [, , alvoId] = interaction.customId.split("_");
    const motivo = interaction.fields.getTextInputValue("ban_motivo");

    try {
        await guild.members.ban(alvoId, { reason: motivo });
        
        // O log será criado automaticamente pelo evento guildBanAdd em banLog.ts
        await interaction.reply({
            content: `🔨 Usuário banido com sucesso!\n**Motivo:** ${motivo}`,
            flags: ["Ephemeral"]
        });
    } catch (error) {
        await interaction.reply({ content: "❌ Erro ao banir o usuário. Verifique minhas permissões.", flags: ["Ephemeral"] });
    }
}
