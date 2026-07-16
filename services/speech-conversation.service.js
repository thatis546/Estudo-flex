import { api } from "../core/api.js";
import { GeminiClient } from "../ai/gemini.js";

const gemini = new GeminiClient({ timeoutMs: 25000 });

export class SpeechConversationService {
    async transcribeAudio(audioBlob, languageCode) {
        const formData = new FormData();
        formData.append("audio", audioBlob, `speech-${Date.now()}.webm`);
        formData.append("language", languageCode);
        const data = await api("speech/transcribe", {
            method: "POST",
            body: formData,
            timeoutMs: 45000
        });
        return String(data?.transcript || data?.text || "").trim();
    }

    async createReply({ transcript, language, profile = {}, professionalTrack = null }) {
        const data = await gemini.send({
            messages: [
                {
                    role: "user",
                    content: transcript
                }
            ],
            context: {
                task: "spoken-language-practice",
                targetLanguage: language.code,
                targetLanguageName: language.name,
                learnerLevel: language.level || "iniciante",
                learnerGoal: profile.goal || "conversation",
                learnerContext: profile.lifeContext || "daily",
                professionalTrack: professionalTrack?.title || null,
                instructions: [
                    "Responda no idioma estudado.",
                    "Use uma resposta curta e natural.",
                    "Faça no máximo uma pergunta de continuação.",
                    "Não invente que analisou pronúncia se recebeu apenas transcrição."
                ]
            }
        });
        return String(data?.text || "").trim();
    }

    async process({ audioBlob, transcript = "", language, profile, professionalTrack }) {
        let finalTranscript = String(transcript || "").trim();
        if (!finalTranscript && audioBlob) {
            finalTranscript = await this.transcribeAudio(audioBlob, language.code);
        }
        if (!finalTranscript) {
            throw new Error("Não foi possível obter uma transcrição da fala.");
        }
        const replyText = await this.createReply({
            transcript: finalTranscript,
            language,
            profile,
            professionalTrack
        });
        return { transcript: finalTranscript, replyText };
    }
}

export const speechConversation = new SpeechConversationService();
