import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { STARTER_VOCABULARY } from "../data/starter-vocabulary.js";

function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

export function getCurrentReviewQueue() {
    const record = state.getLanguage(state.currentLanguage);
    if (!record) return [];

    if (!Array.isArray(record.reviewQueue) || record.reviewQueue.length === 0) {
        record.reviewQueue = clone(STARTER_VOCABULARY[record.code] || []).map((item) => ({
            ...item,
            seen: 0,
            correct: 0,
            nextReviewAt: null
        }));
        storage.save();
    }
    return record.reviewQueue;
}

export function recordReviewAnswer(itemId, rating) {
    const record = state.getLanguage(state.currentLanguage);
    if (!record || !Array.isArray(record.reviewQueue)) return null;
    const item = record.reviewQueue.find((entry) => entry.id === itemId);
    if (!item) return null;

    item.seen = Number(item.seen || 0) + 1;
    if (rating === "known") item.correct = Number(item.correct || 0) + 1;
    const delayDays = rating === "known" ? 4 : rating === "hard" ? 1 : 0;
    item.nextReviewAt = new Date(Date.now() + delayDays * 86400000).toISOString();

    record.stats = record.stats || {};
    record.stats.reviewsCompleted = Number(record.stats.reviewsCompleted || 0) + 1;
    if (rating === "known" && item.correct === 1) {
        record.stats.knownWords = Number(record.stats.knownWords || 0) + 1;
    }
    storage.save();
    return item;
}
