import { createResponder } from "#base";
import { ResponderType } from "@constatic/base";
import { createRow } from "@magicyan/discord";
import {
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits,
} from "discord.js";
import {
    generateId,
    pollStore,
    type PollType
} from "./store.js";

createResponder({
    customId: "poll/modal/:type",
    types: [ResponderType.Modal, ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({ type: params.type as PollType }),
    async run(interaction, { type }) {
        const { fields, guild, channel, user } = interaction;

        const question = fields.getTextInputValue("question").trim();

        // ── Validar e processar opções ─────────────────────────────────────
        const labels: string[] = [];
        if (type !== "text") {
            const lines = fields.getTextInputValue("options")
                .split("\n").map(l => l.trim()).filter(Boolean);

            if (lines.length < 2) {
                await interaction.reply({ flags: ["Ephemeral"], content: "❌ Informe pelo menos **2 opções** separadas por linha." });
                return;
            }
            if (lines.length > 5) {
                await interaction.reply({ flags: ["Ephemeral"], content: "❌ O máximo de opções é **5**." });
                return;
            }
            labels.push(...lines);
        }

        await interaction.deferReply({ flags: ["Ephemeral"] });

        const id = generateId();

        // ── Canal privado de resultados ────────────────────────────────────
        const resultChannel = await guild.channels.create({
            name: `resultados-${id.toLowerCase()}`,
            type: ChannelType.GuildText,
            topic: `Resultados da enquete: "${question}"`,
            permissionOverwrites: [
                { id: guild.roles.everyone, deny:  [PermissionFlagsBits.ViewChannel] },
                { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
            ],
        });

        const typeLabel: Record<PollType, string> = {
            single: "🔘 Uma resposta",
            multi:  "☑️ Múltipla escolha",
            text:   "✏️ Resposta por extenso",
        };
        const typeHint: Record<PollType, string> = {
            single: "-# 🔘 Selecione uma opção",
            multi:  "-# ☑️ Selecione uma ou mais opções",
            text:   "-# ✏️ Clique em **Responder** para enviar sua resposta",
        };

        const pollOptions = labels.map((label, i) => ({
            id: String(i), label, voteCount: 0, voters: [] as string[],
        }));

        // ── Salvar no store ────────────────────────────────────────────────
        pollStore.set(id, {
            id,
            guildId:         guild.id,
            channelId:       channel!.id,
            messageId:       "",
            resultChannelId: resultChannel.id,
            createdBy:       user.id,
            question,
            type,
            options:         pollOptions,
            votes:           new Map(),
            closed:          false,
        });

        // ── Montar mensagem pública ────────────────────────────────────────
        let msg;

        if (type === "text") {
            const embed = new EmbedBuilder()
                .setColor(0x313338)
                .setTitle(question)
                .setDescription(`${typeHint.text}\n\n📬 **0 respostas recebidas**`)
                .setFooter({ text: `${typeLabel.text} · por ${user.displayName}`, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            const replyBtn = new ButtonBuilder({
                customId: `poll/reply/${id}`,
                label:    "Responder",
                style:    ButtonStyle.Primary,
                emoji:    "✏️",
            });

            msg = await channel!.send({ embeds: [embed], components: [createRow(replyBtn)] });
        } else {
            const emptyBars = pollOptions
                .map(o => `**${o.label}**\n\`${"░".repeat(18)}\` **0%** · *0 votos*`)
                .join("\n\n");

            const embed = new EmbedBuilder()
                .setColor(0x313338)
                .setTitle(question)
                .setDescription(`${typeHint[type]}\n\n${emptyBars}`)
                .setFooter({ text: `${typeLabel[type]} · 0 votos · por ${user.displayName}`, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            const voteButtons = pollOptions.map(o =>
                new ButtonBuilder({
                    customId: `poll/vote/${id}/${o.id}`,
                    label:    o.label,
                    style:    ButtonStyle.Secondary,
                })
            );

            const rows = [];
            for (let i = 0; i < voteButtons.length; i += 5) rows.push(createRow(...voteButtons.slice(i, i + 5)));

            msg = await channel!.send({ embeds: [embed], components: rows });
        }

        pollStore.get(id)!.messageId = msg.id;

        // ── Canal privado: boas-vindas + botão encerrar ────────────────────
        const closeBtn = new ButtonBuilder({
            customId: `poll/close/${id}`,
            label:    "Encerrar Enquete",
            style:    ButtonStyle.Danger,
            emoji:    "🔒",
        });

        await resultChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x313338)
                    .setTitle("📋 Sala de Resultados")
                    .setDescription(
                        `**${question}**\n\n` +
                        `Tipo: **${typeLabel[type]}**\n` +
                        `🔒 Apenas você tem acesso a esta sala.\n\n` +
                        `Os votos aparecerão aqui em tempo real.`
                    )
                    .setFooter({ text: `ID: ${id}` })
                    .setTimestamp(),
            ],
            components: [createRow(closeBtn)],
        });

        await interaction.editReply(
            `✅ Enquete criada! [Ir para a enquete](${msg.url})\n🔒 Sala privada: ${resultChannel}`
        );
    },
});
