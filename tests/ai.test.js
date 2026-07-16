import assert from "node:assert/strict";
import test from "node:test";
import { MentorEngine } from "../ai/mentor-engine.js";
import { buildMentorPrompt } from "../ai/prompt-builder.js";

test("converte escalas antigas de 0 a 1 para a escala de 0 a 10", () => {
    const prompt = buildMentorPrompt({
        mentorStyle: {
            humor: 0.8,
            sarcasm: 0.1,
            correctionStyle: "immediate"
        }
    });

    assert.match(prompt, /Humor 8\/10/);
    assert.match(prompt, /sarcasmo 1\/10/);
    assert.match(prompt, /Correção: immediate/);
});

test("o MentorEngine usa o código do idioma e limita o histórico", async () => {
    let request = null;
    const client = {
        async send(payload) {
            request = payload;
            return { text: "Resposta" };
        }
    };
    const memory = {
        relevant({ languageId }) {
            assert.equal(languageId, "fr");
            return [];
        }
    };
    const engine = new MentorEngine({ client, memory });
    const history = Array.from({ length: 30 }, (_, index) => ({
        role: "user",
        content: `Mensagem ${index}`
    }));

    const result = await engine.reply({
        message: "Bonjour",
        language: { code: "fr", name: "Francês" },
        history
    });

    assert.equal(result.text, "Resposta");
    assert.equal(request.context.languageId, "fr");
    assert.equal(request.messages.length, 22);
});
