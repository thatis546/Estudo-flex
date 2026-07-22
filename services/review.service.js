import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { hasCompletedLearningActivity } from "./lesson.service.js";

const CONTACT_INTERVALS_HOURS = Object.freeze({
    never: { forgot: 6, hard: 18, known: 48 },
    basics: { forgot: 8, hard: 24, known: 72 },
    sometimes: { forgot: 12, hard: 48, known: 120 },
    frequent: { forgot: 24, hard: 72, known: 168 },
    advanced: { forgot: 48, hard: 120, known: 336 }
});

function parseTime(value, fallback = 0) {
    const timestamp = Date.parse(value || "");
    return Number.isFinite(timestamp) ? timestamp : fallback;
}

function isValidReviewItem(item) {
    return Boolean(
        item &&
        item.id &&
        item.front &&
        item.back &&
        item.sourceActivityId &&
        item.introducedAt
    );
}

function allReviewItems(record) {
    return Array.isArray(record?.reviewQueue)
        ? record.reviewQueue.filter(isValidReviewItem)
        : [];
}

function dueItems(record, now = Date.now()) {
    return allReviewItems(record).filter((item) => {
        const dueAt = parseTime(item.nextReviewAt, parseTime(item.introducedAt, 0));
        return dueAt <= now;
    });
}

export function getCurrentReviewQueue({ now = Date.now() } = {}) {
    const record = state.getLanguage(state.currentLanguage);
    if (!record) return [];
    return dueItems(record, now);
}

export function getReviewAvailability(record = state.getLanguage(state.currentLanguage), now = Date.now()) {
    if (!record || !hasCompletedLearningActivity(record)) {
        return {
            status: "no-activity",
            dueCount: 0,
            totalCount: 0,
            nextReviewAt: null,
            items: []
        };
    }

    const items = allReviewItems(record);
    if (items.length === 0) {
        return {
            status: "no-items",
            dueCount: 0,
            totalCount: 0,
            nextReviewAt: null,
            items: []
        };
    }

    const due = dueItems(record, now);
    if (due.length > 0) {
        return {
            status: "available",
            dueCount: due.length,
            totalCount: items.length,
            nextReviewAt: null,
            items: due
        };
    }

    const nextReviewAt = items
        .map((item) => item.nextReviewAt)
        .filter(Boolean)
        .sort((a, b) => parseTime(a) - parseTime(b))[0] || null;

    return {
        status: "scheduled",
        dueCount: 0,
        totalCount: items.length,
        nextReviewAt,
        items: []
    };
}

export function formatNextReview(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "mais tarde";
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function intervalHoursFor(record, item, rating) {
    const contact = String(
        record?.learningProfile?.contact ||
        item?.contactAtIntroduction ||
        state.profile?.contact ||
        "never"
    ).trim();
    const intervals = CONTACT_INTERVALS_HOURS[contact] || CONTACT_INTERVALS_HOURS.never;
    const base = intervals[rating] || intervals.hard;
    const successfulRecalls = Math.max(0, Number(item?.correct) || 0);
    const multiplier = rating === "known" ? Math.min(2.5, 1 + successfulRecalls * 0.25) : 1;
    return Math.max(1, Math.round(base * multiplier));
}

export function recordReviewAnswer(itemId, rating) {
    const allowedRatings = new Set(["forgot", "hard", "known"]);
    if (!allowedRatings.has(rating)) return null;

    const record = state.getLanguage(state.currentLanguage);
    if (!record || !Array.isArray(record.reviewQueue)) return null;
    const item = record.reviewQueue.find((entry) => entry.id === itemId && isValidReviewItem(entry));
    if (!item) return null;

    item.seen = Number(item.seen || 0) + 1;
    if (rating === "known") item.correct = Number(item.correct || 0) + 1;
    const delayHours = intervalHoursFor(record, item, rating);
    item.lastRating = rating;
    item.lastReviewedAt = new Date().toISOString();
    item.nextReviewAt = new Date(Date.now() + delayHours * 3600000).toISOString();

    record.stats = record.stats || {};
    record.stats.reviewsCompleted = Number(record.stats.reviewsCompleted || 0) + 1;
    if (rating === "known" && item.correct === 1) {
        record.stats.knownWords = Number(record.stats.knownWords || 0) + 1;
    }
    storage.save();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("state-updated", { detail: state.toJSON() }));
    }
    return item;
}
