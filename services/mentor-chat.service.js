import { GeminiClient } from "../ai/gemini.js";
import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { mentor } from "./mentor.service.js";
import { addAIMemory } from "./profile-privacy.service.js";
import { api } from "../core/api.js";

const gemini = new GeminiClient({ timeoutMs: 40000 });

function getConversationStore(languageCode) {
    if (!state.user.mentorConversations || typeof state.user.mentorConversations !== "object") {
        state.user.mentorConversations = {};
    }
    if (!Array.isArray(state.user.mentorConversations[languageCode])) {
        state.user.mentorConversations[languageCode] = [];
    }
    return state.user.mentorConversations[languageCode];
}

export function getMentorConversation(languageCode = state.currentLanguage) {
    return getConversationStore(languageCode).slice(-60);
}

export function clearMentorConversation(languageCode = state.currentLanguage) {
    if (!state.user.mentorConversations || typeof state.user.mentorConversations !== "object") {
        state.user.mentorConversations = {};
    }
    state.user.mentorConversations[languageCode] = [];
    storage.save();
}

function localFallback(message, summary) {
    const language = summary.languageName || "o idioma";
    return `Recebi sua mensagem sobre ${language}. O backend da IA ainda não está conectado, mas posso registrar o contexto e manter esta conversa salva. Quando a integração estiver ativa, responderei de forma personalizada à sua jornada ${summary.journeyLabel || "inicial"}.`;
}

export async function sendMentorMessage(message, { signal } = {}) {
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage) throw new Error("Digite uma mensagem para o Mentor.");
    const summary = mentor.getSummary();
    const conversation = getConversationStore(summary.languageCode || "global");
    const userMessage = {
        id: globalThis.crypto?.randomUUID?.() || `message-${Date.now()}`,
        role: "user",
        text: cleanMessage,
        createdAt: new Date().toISOString()
    };
    conversation.push(userMessage);
    storage.save();

    let payload;
    try {
        payload = await gemini.send({
            signal,
            messages: conversation.slice(-20).map((item) => ({ role: item.role, content: item.text })),
            context: {
                task: "mentor-text-chat",
                profile: summary,
                instructions: [
                    "Responda como mentor pedagógico, não como personagem fictício.",
                    "Use a língua materna como apoio quando necessário.",
                    "Não invente nível, progresso ou conquistas.",
                    "Quando identificar um fato pedagógico útil, retorne memories como uma lista de objetos com text e category.",
                    "Uma conquista só pode ser sugerida quando a mensagem do estudante descreve uma ação já realizada, nunca uma intenção."
                ]
            }
        });
    } catch (error) {
        payload = { text: localFallback(cleanMessage, summary), offline: true, error: error.message };
    }

    const assistantMessage = {
        id: globalThis.crypto?.randomUUID?.() || `message-${Date.now()}-assistant`,
        role: "assistant",
        text: String(payload?.text || "Não consegui formular uma resposta.").trim(),
        createdAt: new Date().toISOString(),
        offline: Boolean(payload?.offline)
    };
    conversation.push(assistantMessage);
    conversation.splice(0, Math.max(0, conversation.length - 100));
    storage.save();

    if (Array.isArray(payload?.memories)) {
        for (const item of payload.memories.slice(0, 4)) {
            await addAIMemory({
                text: item?.text,
                category: item?.category || "mentor",
                source: "mentor",
                languageCode: summary.languageCode
            });
        }
    }

    if (payload?.achievementCandidate) {
        try {
            const { registerConversationAchievementCandidate } = await import("./achievement-service.js");
            await registerConversationAchievementCandidate(payload.achievementCandidate, {
                sourceQuote: cleanMessage,
                languageCode: summary.languageCode
            });
        } catch (error) {
            console.warn("A sugestão de conquista não foi registrada:", error);
        }
    }

    return { userMessage, assistantMessage, payload };
}


export const MENTOR_ACTIVITIES = Object.freeze([
    { id: "explain", icon: "💡", title: "Explicar uma dúvida", prompt: "Explique de forma simples e contextualizada: " },
    { id: "correct", icon: "✍️", title: "Corrigir um texto", prompt: "Corrija o texto abaixo, preserve minha intenção e explique os principais ajustes: " },
    { id: "vocabulary", icon: "🧠", title: "Revisar vocabulário", prompt: "Crie uma revisão curta do meu vocabulário vivo com exemplos ligados ao meu objetivo." },
    { id: "exercise", icon: "🧩", title: "Criar uma atividade", prompt: "Crie uma atividade curta adequada à minha jornada e só mostre a resposta depois que eu tentar." },
    { id: "scenario", icon: "🎭", title: "Simular uma situação em texto", prompt: "Inicie uma simulação em texto ligada ao meu contexto de uso. Faça uma fala por vez e espere minha resposta." },
    { id: "image", icon: "🖼️", title: "Descrever uma imagem", prompt: "Ajude-me a descrever esta imagem no idioma estudado. Faça perguntas e corrija minha tentativa." }
]);

export async function sendMentorImageActivity(file, instruction = "", { signal } = {}) {
    if (!(file instanceof File)) throw new Error("Selecione uma imagem.");
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) throw new Error("Use uma imagem PNG, JPG ou WebP.");
    if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10 MB.");

    const summary = mentor.getSummary();
    const conversation = getConversationStore(summary.languageCode || "global");
    const cleanInstruction = String(instruction || "").trim();
    const userText = cleanInstruction || "Quero praticar a descrição desta imagem.";
    const userMessage = {
        id: globalThis.crypto?.randomUUID?.() || `image-${Date.now()}`,
        role: "user",
        text: `🖼️ ${userText}`,
        createdAt: new Date().toISOString(),
        attachment: { name: file.name, type: file.type }
    };
    conversation.push(userMessage);
    storage.save();

    const formData = new FormData();
    formData.append("image", file, file.name || "mentor-image.webp");
    formData.append("instruction", userText);
    formData.append("context", JSON.stringify(summary));

    let payload;
    try {
        payload = await api("mentor/image-description", {
            method: "POST", body: formData, signal, timeoutMs: 60000
        });
    } catch (error) {
        payload = {
            text: "A imagem foi selecionada, mas o backend multimodal ainda não está disponível. Quando ele estiver conectado, o Mentor fará perguntas de descrição e corrigirá sua resposta.",
            offline: true,
            error: error.message
        };
    }

    const assistantMessage = {
        id: globalThis.crypto?.randomUUID?.() || `image-${Date.now()}-assistant`,
        role: "assistant",
        text: String(payload?.text || "Não foi possível analisar a imagem.").trim(),
        createdAt: new Date().toISOString(),
        offline: Boolean(payload?.offline)
    };
    conversation.push(assistantMessage);
    conversation.splice(0, Math.max(0, conversation.length - 100));
    storage.save();
    return { userMessage, assistantMessage, payload };
}
