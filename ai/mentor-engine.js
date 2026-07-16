import { GeminiClient } from "./gemini.js";
import { MemoryStore } from "./memory.js";
import { moderateText, sanitizeForPrompt } from "./moderation.js";
import { buildMentorPrompt } from "./prompt-builder.js";

export class MentorEngine {
    constructor({ client = new GeminiClient(), memory = new MemoryStore() } = {}) {
        this.client = client;
        this.memory = memory;
    }

    async reply({
        message,
        user,
        language,
        mentorStyle,
        learningContext,
        history = [],
        signal
    } = {}) {
        const safeMessage = String(message ?? "").trim();
        if (!safeMessage) throw new TypeError("A mensagem não pode estar vazia.");

        const moderation = moderateText(safeMessage);
        if (!moderation.allowed) {
            return {
                text: "Não consigo continuar dessa forma. Vou priorizar sua segurança.",
                blocked: true,
                moderation
            };
        }

        const languageId = language?.code || language?.id || null;
        const memories = this.memory.relevant({ languageId, limit: 12 });
        const systemPrompt = buildMentorPrompt({
            user,
            language,
            mentorStyle,
            learningContext,
            memory: memories
        });
        const safeHistory = Array.isArray(history)
            ? history.slice(-20).filter((item) => item && typeof item.content === "string")
            : [];
        const messages = [
            { role: "system", content: systemPrompt },
            ...safeHistory,
            { role: "user", content: sanitizeForPrompt(safeMessage) }
        ];

        const response = await this.client.send({
            messages,
            context: {
                languageId,
                journey: language?.journey || null
            },
            signal
        });

        return {
            text: response.text,
            usage: response.usage || null,
            blocked: false
        };
    }
}
