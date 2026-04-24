import { createEvent } from "#base";
import { cacheMessageAttachments } from "./attachmentCache.js";

createEvent({
    name: "Log: cache de anexos",
    event: "messageCreate",
    async run(message) {
        // Ignora bots mas não ignora mensagens parciais (author pode ser null em partials)
        if (message.author?.bot) return;
        if (message.attachments.size === 0) return;

        await cacheMessageAttachments(
            message.id,
            message.attachments.map(a => ({
                id:          a.id,
                url:         a.url,
                name:        a.name,
                contentType: a.contentType,
            }))
        );
    },
});
