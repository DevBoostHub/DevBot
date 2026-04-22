import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, GuildMember } from "discord.js";

createCommand({
    name: "castigo",
    description: "Silencia um usuário por um tempo determinado.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "usuario",
            description: "O usuário que será castigado",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "duracao",
            description: "Tempo do castigo (ex: 15m, 1h, 24h)",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "motivo",
            description: "O motivo do castigo",
            type: ApplicationCommandOptionType.String,
            required: false, // Opcional
        }
    ],

    async run(interaction) {
        const { options, guild } = interaction;

        if (!guild) return;

        const alvo = options.getMember("usuario") as GuildMember;
        const duracaoTexto = options.getString("duracao", true);
        const motivo = options.getString("motivo") ?? "Nenhum motivo informado";

        // Lógica para transformar "15m" ou "1h" em milissegundos
        const tempo = parseInt(duracaoTexto); // Pega apenas o número (ex: 15)
        const unidade = duracaoTexto.slice(-1).toLowerCase(); // Pega a última letra (ex: m)

        let milissegundos = 0;

        if (unidade === "m") {
            milissegundos = tempo * 60 * 1000; // Minutos -> milissegundos
        } else if (unidade === "h") {
            milissegundos = tempo * 60 * 60 * 1000; // Horas -> milissegundos
        } else {
            await interaction.reply({
                content: "❌ Unidade de tempo inválida! Use 'm' para minutos ou 'h' para horas (ex: 15m, 1h).",
                flags: ["Ephemeral"]
            });
            return;
        }

        // Agora vamos aplicar o castigo (Timeout)
        try {
            await alvo.timeout(milissegundos, motivo);

            await interaction.reply({
                content: `✅ ${alvo.user.username} foi colocado de castigo por ${duracaoTexto}.\n**Motivo:** ${motivo}`,
                flags: ["Ephemeral"]
            });
        } catch (error) {
            await interaction.reply({
                content: `❌ Não consegui castigar este usuário. Verifique se eu tenho permissão.`,
                flags: ["Ephemeral"]
            });
        }
    }
});

