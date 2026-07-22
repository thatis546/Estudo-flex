import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { STARTER_VOCABULARY } from "../data/starter-vocabulary.js";

const CONTACT_DIFFICULTY = Object.freeze({
    never: {
        id: "first-contact",
        label: "Primeiro contato",
        itemCount: 3,
        reviewDelayHours: 18,
        instruction: "Conheça poucas expressões essenciais, com tradução e exemplo visíveis."
    },
    basics: {
        id: "recognition",
        label: "Reconhecimento guiado",
        itemCount: 4,
        reviewDelayHours: 24,
        instruction: "Reconheça expressões conhecidas e observe como elas aparecem em frases curtas."
    },
    sometimes: {
        id: "context",
        label: "Uso em contexto",
        itemCount: 5,
        reviewDelayHours: 36,
        instruction: "Leia as frases completas e tente explicar mentalmente o sentido antes de revelar a tradução."
    },
    frequent: {
        id: "activation",
        label: "Ativação de vocabulário",
        itemCount: 5,
        reviewDelayHours: 48,
        instruction: "Use cada expressão para imaginar uma frase diferente ligada à sua rotina."
    },
    advanced: {
        id: "precision",
        label: "Precisão e variação",
        itemCount: 5,
        reviewDelayHours: 72,
        instruction: "Reformule os exemplos com mais precisão e registre quais expressões ainda não saem naturalmente."
    }
});

function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function nowISO() {
    return new Date().toISOString();
}

export function getContactDifficulty(contact) {
    return CONTACT_DIFFICULTY[String(contact || "").trim()] || CONTACT_DIFFICULTY.never;
}

export function hasCompletedLearningActivity(record = state.getLanguage(state.currentLanguage)) {
    if (!record) return false;
    if (Number(record.stats?.lessonsCompleted) > 0) return true;
    return Array.isArray(record.activityHistory) && record.activityHistory.some((item) => item?.type === "lesson" && item?.completedAt);
}

export function buildFirstActivity(record = state.getLanguage(state.currentLanguage)) {
    if (!record) return null;
    const contact = record.learningProfile?.contact || state.profile?.contact || "never";
    const difficulty = getContactDifficulty(contact);
    const vocabulary = clone(STARTER_VOCABULARY[record.code] || []);
    const items = vocabulary.slice(0, Math.min(vocabulary.length, difficulty.itemCount));
    const activityId = `first-activity:${record.code}:${difficulty.id}`;

    return {
        id: activityId,
        type: "lesson",
        title: `Primeira atividade de ${record.name}`,
        difficulty,
        contact,
        items,
        completed: Array.isArray(record.activityHistory) && record.activityHistory.some((item) => item?.id === activityId && item?.completedAt)
    };
}

export function completeLearningActivity(activity, record = state.getLanguage(state.currentLanguage)) {
    if (!record || !activity?.id || !Array.isArray(activity.items) || activity.items.length === 0) return null;

    record.activityHistory = Array.isArray(record.activityHistory) ? record.activityHistory : [];
    const existing = record.activityHistory.find((item) => item?.id === activity.id && item?.completedAt);
    if (existing) return existing;

    const completedAt = nowISO();
    const delayHours = Math.max(1, Number(activity.difficulty?.reviewDelayHours) || 24);
    const nextReviewAt = new Date(Date.now() + delayHours * 3600000).toISOString();

    record.reviewQueue = Array.isArray(record.reviewQueue) ? record.reviewQueue : [];
    for (const source of activity.items) {
        const itemId = `${activity.id}:${source.id}`;
        if (record.reviewQueue.some((item) => item?.id === itemId)) continue;
        record.reviewQueue.push({
            id: itemId,
            sourceItemId: source.id,
            sourceActivityId: activity.id,
            sourceActivityTitle: activity.title,
            front: source.front,
            back: source.back,
            example: source.example || "",
            introducedAt: completedAt,
            nextReviewAt,
            seen: 0,
            correct: 0,
            contactAtIntroduction: activity.contact,
            difficultyId: activity.difficulty?.id || "first-contact"
        });
    }

    const historyEntry = {
        id: activity.id,
        type: "lesson",
        title: activity.title,
        contact: activity.contact,
        difficultyId: activity.difficulty?.id || "first-contact",
        itemIds: activity.items.map((item) => item.id),
        completedAt,
        nextReviewAt
    };
    record.activityHistory.unshift(historyEntry);
    record.activityHistory = record.activityHistory.slice(0, 100);
    record.stats = record.stats || {};
    record.stats.lessonsCompleted = Number(record.stats.lessonsCompleted || 0) + 1;
    record.progress = Math.min(100, Math.max(0, Number(record.progress || 0)) + 2);

    storage.save();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("learning-activity-completed", {
            detail: { record, activity: historyEntry }
        }));
        window.dispatchEvent(new CustomEvent("state-updated", { detail: state.toJSON() }));
    }
    return historyEntry;
}
