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
import { buildBar, enqueteStore, gerarId, type TipoEnquete } from "./store.js";

createResponder({
    customId: "/staff/enquete/modal/:tipo",
    types: [ResponderType.Modal, ResponderType.ModalComponent],
    cache: "cached",
    parse: params => ({ tipo: params.tipo as TipoEnquete }),
    async run(interaction, { tipo }) {
        try {
            console.log("📊 Responder modal acionado com tipo:", tipo);
            const { fields, channel, user } = interaction;

            // Validar tipo de enquete
            const tiposValidos: TipoEnquete[] = ["alternativa", "checkbox", "input"];
            if (!tipo || !tiposValidos.includes(tipo)) {
                console.error("❌ Tipo inválido:", tipo);
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: `❌ Tipo de enquete inválido: ${tipo}. Tipos válidos: ${tiposValidos.join(", ")}`,
                });
                return;
            }

            if (!channel || !channel.isTextBased()) {
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: "❌ Este comando só funciona em canais de texto.",
                });
                return;
            }

            const pergunta = fields.getTextInputValue("pergunta").trim();

            if (!pergunta || pergunta.length === 0) {
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: "❌ A pergunta não pode estar vazia.",
                });
                return;
            }

            if (pergunta.length > 256) {
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: "❌ A pergunta não pode ter mais de 256 caracteres.",
                });
                return;
            }

            // ── Processar opções (apenas para alternativa / checkbox) ──────────
            const opcoes: string[] = [];
            if (tipo !== "input") {
                const opcoesRaw = fields.getTextInputValue("opcoes");
                console.log("Opções brutas:", opcoesRaw);
                const linhas = opcoesRaw
                    .split("\n")
                    .map(l => l.trim())
                    .filter(Boolean);

                console.log("Opções processadas:", linhas);

                if (linhas.length < 2) {
                    await interaction.reply({
                        flags: ["Ephemeral"],
                        content: "❌ Informe pelo menos **2 opções** separadas por linha.",
                    });
                    return;
                }
                if (linhas.length > 5) {
                    await interaction.reply({
                        flags: ["Ephemeral"],
                        content: "❌ O máximo de opções permitido é **5**.",
                    });
                    return;
                }
                opcoes.push(...linhas);
            }

        // ── Criar enquete no store ─────────────────────────────────────────
        const id = gerarId();
        enqueteStore.set(id, {
            id,
            pergunta,
            tipo,
            opcoes: opcoes.map(label => ({ label, votes: new Set() })),
            respostas: [],
            criadoPor: user.id,
            channelId: channel.id,
        });

        // ── Montar embed base ──────────────────────────────────────────────
        const tipoLabel: Record<TipoEnquete, string> = {
            alternativa: "🔘 Uma resposta",
            checkbox: "☑️ Múltipla escolha",
            input: "✏️ Resposta por extenso",
        };

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${pergunta}`)
            .setColor(0x5865f2)
            .setFooter({
                text: `Tipo: ${tipoLabel[tipo]} • ID: ${id} • Criado por ${user.displayName}`,
                iconURL: user.displayAvatarURL(),
            })
            .setTimestamp();

        // ── Tipo "input": criar canal privado para respostas ────────────────
        if (tipo === "input") {
            embed.setDescription(
                "✏️ Clique no botão abaixo para enviar sua resposta por extenso.\n\n" +
                "📬 **0 respostas recebidas**"
            );

            const btn = new ButtonBuilder({
                customId: `/staff/enquete/input/${id}`,
                label: "Responder",
                style: ButtonStyle.Primary,
                emoji: "✏️",
            });

            const deleteBtn = new ButtonBuilder({
                customId: `/staff/enquete/delete/${id}`,
                label: "Destruir Sala",
                style: ButtonStyle.Danger,
                emoji: "🗑️",
            });

            // Criar canal privado para armazenar respostas
            const responseChannel = await channel.guild.channels.create({
                name: `respostas-enquete-${id.toLowerCase()}`,
                type: ChannelType.GuildText,
                topic: `📋 Respostas da enquete: "${pergunta}" (ID: ${id})`,
                permissionOverwrites: [
                    {
                        id: channel.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ReadMessageHistory,
                        ],
                    },
                ],
            });

            enqueteStore.get(id)!.responseChannelId = responseChannel.id;

            // Enviar embed de boas-vindas no canal de respostas (com botão de destruir)
            await responseChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`📋 Sala de Respostas — ${pergunta}`)
                        .setDescription(
                            `Todas as respostas para esta enquete serão armazenadas aqui.\n\n` +
                            `🔒 **Apenas você consegue acessar esta sala.**`
                        )
                        .setColor(0x5865f2)
                        .setFooter({ text: `ID da enquete: ${id}` })
                        .setTimestamp(),
                ],
                components: [createRow(deleteBtn)],
            });

            const msg = await channel.send({
                embeds: [embed],
                components: [createRow(btn)],
            });

            enqueteStore.get(id)!.messageId = msg.id;

            await interaction.reply({
                flags: ["Ephemeral"],
                content: `✅ Enquete criada com sucesso! [Ir para a enquete](${msg.url})\n🔒 Uma sala privada foi criada para armazenar as respostas.`,
            });
            return;
        }

        // ── Tipos alternativa / checkbox: botões de voto ───────────────────
        embed.addFields(
            opcoes.map(opcao => ({
                name: opcao,
                value: buildBar(0, 0),
                inline: false,
            }))
        );

        if (tipo === "alternativa") {
            embed.setDescription("🔘 Selecione **uma opção** clicando no botão abaixo.");
        } else {
            embed.setDescription("☑️ Você pode selecionar **múltiplas opções**. Clique novamente para desmarcar.");
        }

        // Botões de votação — máx. 5 por linha (ActionRow)
        const buttons = opcoes.map((opcao, i) =>
            new ButtonBuilder({
                customId: `/staff/enquete/votar/${id}/${i}`,
                label: opcao,
                style: ButtonStyle.Secondary,
            })
        );

        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            rows.push(createRow(...buttons.slice(i, i + 5)));
        }

        const msg = await channel.send({ embeds: [embed], components: rows });
        enqueteStore.get(id)!.messageId = msg.id;

        await interaction.reply({
            flags: ["Ephemeral"],
            content: `✅ Enquete criada com sucesso! [Ir para a enquete](${msg.url})`,
        });
        } catch (err) {
            console.error("Erro ao criar enquete:", err);
            try {
                await interaction.reply({
                    flags: ["Ephemeral"],
                    content: "❌ Ocorreu um erro ao criar a enquete. Tente novamente.",
                });
            } catch {
                console.error("Erro ao responder ao usuário:", err);
            }
        }
    },
});
