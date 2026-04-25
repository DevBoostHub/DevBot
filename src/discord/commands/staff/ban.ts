import { createCommand } from "#base";
import { env } from "#env";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    type ChatInputCommandInteraction,
    EmbedBuilder,
    type Guild,
    type GuildMember,
    PermissionFlagsBits,
    type User,
} from "discord.js";

const BAN_ERROR_MESSAGE = "❌ Não foi possível banir este usuário.";
const DELETE_MESSAGE_SECONDS_MAX = 7 * 24 * 60 * 60;

const deleteMessageChoices = [
    { name: "Não apagar mensagens", value: 0 },
    { name: "Última hora", value: 60 * 60 },
    { name: "Últimas 6 horas", value: 6 * 60 * 60 },
    { name: "Últimas 12 horas", value: 12 * 60 * 60 },
    { name: "Último dia", value: 24 * 60 * 60 },
    { name: "Últimos 3 dias", value: 3 * 24 * 60 * 60 },
    { name: "Últimos 7 dias", value: DELETE_MESSAGE_SECONDS_MAX },
];

type BanOptions = {
    targetUser: User;
    reason: string;
    deleteMessageSeconds: number;
};

type BanLogData = {
    targetMember: GuildMember;
    moderator: User;
    reason: string;
};

createCommand({
    name: "ban",
    description: "Bane um usuário do servidor",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.BanMembers],
    dmPermission: false,
    options: [
        {
            name: "usuário",
            description: "Usuário a ser banido",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "motivo",
            description: "Motivo do banimento, exibido nos logs de moderação",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "apagar",
            description: "Quanto do histórico de mensagens deve ser apagado",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            autocomplete: async () => deleteMessageChoices,
            minValue: 0,
            maxValue: DELETE_MESSAGE_SECONDS_MAX,
        },
    ],
    async run(interaction) {
        const options = getBanOptions(interaction);

        await interaction.deferReply({ flags: ["Ephemeral"] });

        try {
            const targetMember = await fetchTargetMember(interaction.guild, options.targetUser.id);
            const botMember = await fetchBotMember(interaction.guild);

            if (!canBanMember(targetMember, botMember)) {
                await replyBanError(interaction);
                return;
            }

            await banMember(targetMember, options.reason, options.deleteMessageSeconds);
            await sendBanLog(interaction.guild, {
                targetMember,
                moderator: interaction.user,
                reason: options.reason,
            });

            await interaction.editReply(`✅ ${targetMember.user.tag} foi banido(a) do servidor.`);
        } catch (error) {
            console.error("[ban] Failed to ban user", error);
            await replyBanError(interaction);
        }
    },
});

function getBanOptions(interaction: ChatInputCommandInteraction): BanOptions {
    return {
        targetUser: interaction.options.getUser("usuário", true),
        reason: interaction.options.getString("motivo", true),
        deleteMessageSeconds: interaction.options.getInteger("apagar") ?? 0,
    };
}

async function fetchTargetMember(guild: Guild, userId: string) {
    return guild.members.fetch(userId);
}

async function fetchBotMember(guild: Guild) {
    return guild.members.me ?? guild.members.fetchMe();
}

function canBanMember(targetMember: GuildMember, botMember: GuildMember) {
    return targetMember.bannable
        && targetMember.roles.highest.comparePositionTo(botMember.roles.highest) < 0;
}

async function banMember(targetMember: GuildMember, reason: string, deleteMessageSeconds: number) {
    await targetMember.ban({ reason, deleteMessageSeconds });
}

async function sendBanLog(guild: Guild, data: BanLogData) {
    if (!env.LOG_CHANNEL_ID) return;

    try {
        const logChannel = await guild.channels.fetch(env.LOG_CHANNEL_ID);
        if (!logChannel?.isTextBased()) return;

        await logChannel.send({ embeds: [createBanLogEmbed(data)] });
    } catch (error) {
        console.error("[ban] Failed to send ban log", error);
    }
}

function createBanLogEmbed({ targetMember, moderator, reason }: BanLogData) {
    return new EmbedBuilder()
        .setTitle("🔨 Usuário Banido")
        .setColor(0xFF0000)
        .addFields(
            { name: "Usuário Banido", value: `${targetMember.user.tag} (ID: ${targetMember.id})` },
            { name: "Moderador", value: `${moderator.tag} (ID: ${moderator.id})` },
            { name: "Motivo", value: reason },
            { name: "Data/Hora", value: new Date().toLocaleString("pt-BR") }
        );
}

async function replyBanError(interaction: ChatInputCommandInteraction) {
    await interaction.editReply(BAN_ERROR_MESSAGE);
}
