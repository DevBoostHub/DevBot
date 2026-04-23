import { createEvent } from "#base";
import { cacheMessageAttachments } from "./cache.js";

// Escuta todas as mensagens e faz cache dos anexos em memória
createEvent({
    name: "Log: cache de anexos",
    event: "messageCreate",
    async run(message) {
        if (message.attachments.size === 0) return;
        await cacheMessageAttachments(message.id, [...message.attachments.values()]);
    },
});
