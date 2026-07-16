import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { api } from "../core/api.js";
import { getCommunicationModule } from "../data/communication-modules.js";
import { addActivityXP, registerAchievementEvent, checkMetricAchievements } from "./achievement-service.js";

const FILLERS = {
    en: ["um", "uh", "like", "you know", "actually", "basically", "so"],
    fr: ["euh", "en fait", "du coup", "genre", "donc"],
    de: ["äh", "ähm", "also", "halt", "sozusagen"],
    it: ["ehm", "cioè", "praticamente", "allora", "diciamo"],
    es: ["eh", "este", "o sea", "pues", "bueno"],
    pt: ["é", "tipo", "assim", "né", "então", "ahn"]
};

const STOP_WORDS = new Set(["a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "ou", "em", "um", "uma", "the", "and", "or", "to", "of", "in", "le", "la", "les", "de", "et", "der", "die", "das", "und", "il", "lo", "la", "e", "el", "los", "las", "y"]);

function normalizeText(value) {
    return String(value ?? "").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function tokenize(value) {
    return normalizeText(value).match(/[\p{L}\p{N}'-]+/gu) || [];
}

function countOccurrences(text, phrase) {
    const normalizedPhrase = normalizeText(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (normalizeText(text).match(new RegExp(`\\b${normalizedPhrase}\\b`, "g")) || []).length;
}

export function analyzeCommunication({ transcript = "", durationSeconds = 0, languageCode = "en", moduleId = "pronunciation", audioMetrics = {} } = {}) {
    const cleanTranscript = String(transcript || "").trim();
    const words = tokenize(cleanTranscript);
    const durationMinutes = Math.max(1 / 60, Number(durationSeconds) / 60);
    const contentWords = words.filter((word) => word.length > 2 && !STOP_WORDS.has(word));
    const frequencies = contentWords.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());
    const repetitions = [...frequencies.entries()]
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word, count]) => ({ word, count }));
    const fillers = (FILLERS[languageCode] || FILLERS.pt)
        .map((filler) => ({ filler, count: countOccurrences(cleanTranscript, filler) }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    const uniqueWords = new Set(contentWords).size;
    const lexicalVariety = contentWords.length ? uniqueWords / contentWords.length : 0;
    const wordsPerMinute = Math.round(words.length / durationMinutes);
    const sentenceCount = Math.max(1, (cleanTranscript.match(/[.!?]+/g) || []).length);
    const averageSentenceWords = Number((words.length / sentenceCount).toFixed(1));
    const fillerCount = fillers.reduce((sum, item) => sum + item.count, 0);

    const recommendations = [];
    if (wordsPerMinute > 175) recommendations.push("Reduza um pouco a velocidade e marque pausas entre as ideias.");
    else if (wordsPerMinute && wordsPerMinute < 75) recommendations.push("Tente sustentar frases um pouco mais longas antes de pausar.");
    if (fillerCount / durationMinutes > 4) recommendations.push("Substitua algumas muletas por uma pausa silenciosa curta.");
    if (repetitions.length) recommendations.push(`Reescreva ou repita a fala trocando: ${repetitions.slice(0, 3).map((item) => item.word).join(", ")}.`);
    if (lexicalVariety < 0.48 && contentWords.length >= 20) recommendations.push("Use sinônimos e exemplos para ampliar a variedade lexical.");
    if (!recommendations.length) recommendations.push("Repita o exercício buscando mais naturalidade, sem acelerar.");

    return {
        moduleId,
        moduleTitle: getCommunicationModule(moduleId).title,
        transcript: cleanTranscript,
        durationSeconds: Math.max(0, Number(durationSeconds) || 0),
        words: words.length,
        wordsPerMinute,
        lexicalVariety: Number(lexicalVariety.toFixed(2)),
        averageSentenceWords,
        fillers,
        fillerCount,
        repetitions,
        audioMetrics: {
            averageVolume: Number(audioMetrics.averageVolume) || 0,
            peakVolume: Number(audioMetrics.peakVolume) || 0,
            silenceRatio: Number(audioMetrics.silenceRatio) || 0
        },
        recommendations,
        pronunciationStatus: "A transcrição mede reconhecimento e inteligibilidade. A análise fonética detalhada exige o serviço de pronúncia do backend.",
        createdAt: new Date().toISOString()
    };
}

export async function transcribeCommunicationAudio(audioBlob, languageCode) {
    const formData = new FormData();
    formData.append("audio", audioBlob, `communication-${Date.now()}.webm`);
    formData.append("language", languageCode);
    const response = await api("speech/transcribe", { method: "POST", body: formData, timeoutMs: 60000 });
    return String(response?.transcript || response?.text || "").trim();
}

export function saveCommunicationReport(report, { languageCode = state.currentLanguage, sessionId = "" } = {}) {
    const record = state.getLanguage(languageCode);
    if (!record) throw new Error("Idioma não encontrado para salvar o relatório.");
    if (!record.communicationLab || typeof record.communicationLab !== "object") {
        record.communicationLab = { selectedModule: report.moduleId, reports: [], settings: { transcriptLanguage: "auto", keepAudio: false } };
    }
    record.communicationLab.selectedModule = report.moduleId;
    record.communicationLab.reports.unshift({
        id: sessionId || globalThis.crypto?.randomUUID?.() || `communication-${Date.now()}`,
        ...report
    });
    record.communicationLab.reports = record.communicationLab.reports.slice(0, 100);
    record.stats.communicationSessions = Math.max(0, Number(record.stats.communicationSessions) || 0) + 1;
    record.stats.speakingMinutes = Number((Math.max(0, Number(record.stats.speakingMinutes) || 0) + report.durationSeconds / 60).toFixed(2));
    storage.save();
    addActivityXP(8, {
        idempotencyKey: `communication:${record.code}:${sessionId || report.createdAt}`,
        reason: `Communication Lab: ${report.moduleTitle}`,
        languageCode: record.code,
        durationMinutes: Number((Math.max(0, Number(report.durationSeconds) || 0) / 60).toFixed(2)),
        activity: { type: "communication", title: report.moduleTitle, completedAt: report.createdAt }
    });
    registerAchievementEvent("communication-lab-completed", { language: record.code });
    checkMetricAchievements("communicationMinutes", record.stats.speakingMinutes, { language: record.code });
    return report;
}
