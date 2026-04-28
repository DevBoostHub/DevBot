import { Schema } from "mongoose";
import { t } from "../utils.js";

export const modlogSchema = new Schema(
    {
        guildId: t.string,
        moderatorId: t.string,
        moderatorTag: t.string,
        targetId: t.string,
        targetTag: t.string,
        action: { type: String, required: true, enum: ["CASTIGO", "BAN"] },
        reason: { type: String, default: "Sem motivo informado" },
        duration: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
    },
    {
        statics: {
            async getLogs(guildId: string, targetId?: string) {
                const query: Record<string, string> = { guildId };
                if (targetId) query.targetId = targetId;
                return await this.find(query).sort({ createdAt: -1 }).limit(25);
            }
        }
    }
);
