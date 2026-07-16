import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { EF_LANGUAGES } from "../data/languages.js";
import { ACHIEVEMENT_CATALOG, getAchievementById } from "../data/achievement-catalog.js";

const NATIVE_LANGUAGE_NAMES = Object.freeze({
    en: "English",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    es: "Español"
});

const LANGUAGE_TERMS = Object.freeze({
    en: ["inglês", "english"],
    fr: ["francês", "français", "french"],
    de: ["alemão", "deutsch", "german"],
    it: ["italiano", "italian"],
    es: ["espanhol", "español", "spanish"]
});

function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function cleanText(value, fallback = "") {
    const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
    return normalized || fallback;
}

function normalizeLanguageCode(value) {
    const raw = typeof value === "object" && value !== null
        ? value.code || value.id || ""
        : value;
    return cleanText(raw).toLowerCase();
}

function makeId(prefix = "record") {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureAchievementState() {
    state.profile = state.profile && typeof state.profile === "object" ? state.profile : {};
    state.profile.achievements = Array.isArray(state.profile.achievements)
        ? state.profile.achievements
        : [];
    state.profile.xpLedger = Array.isArray(state.profile.xpLedger)
        ? state.profile.xpLedger
        : [];
    state.profile.xp = Math.max(0, Number(state.profile.xp) || 0);
    state.profile.activityXP = Math.max(0, Number(state.profile.activityXP) || 0);
    state.profile.learning = state.profile.learning && typeof state.profile.learning === "object"
        ? state.profile.learning
        : {};
    state.profile.learning.recentActivities = Array.isArray(state.profile.learning.recentActivities)
        ? state.profile.learning.recentActivities
        : [];
    state.profile.learning.streak = Math.max(0, Number(state.profile.learning.streak) || 0);
    state.profile.learning.totalStudyMinutes = Math.max(0, Number(state.profile.learning.totalStudyMinutes) || 0);
    state.profile.learning.lastStudyDate = cleanText(state.profile.learning.lastStudyDate);
}

function studyDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return studyDateKey(new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function dateKeyDistance(previousKey, currentKey) {
    const previous = /^\d{4}-\d{2}-\d{2}$/.test(previousKey)
        ? new Date(`${previousKey}T12:00:00`)
        : new Date(previousKey);
    const current = /^\d{4}-\d{2}-\d{2}$/.test(currentKey)
        ? new Date(`${currentKey}T12:00:00`)
        : new Date(currentKey);
    if (Number.isNaN(previous.getTime()) || Number.isNaN(current.getTime())) return Number.POSITIVE_INFINITY;
    return Math.round((current.getTime() - previous.getTime()) / 86400000);
}

function updateLearningActivityMetrics(earnedAt, metadata = {}) {
    const learning = state.profile.learning;
    const currentKey = studyDateKey(earnedAt);
    const previousKey = cleanText(learning.lastStudyDate);

    if (previousKey !== currentKey) {
        const distance = previousKey ? dateKeyDistance(previousKey, currentKey) : Number.POSITIVE_INFINITY;
        learning.streak = distance === 1
            ? Math.max(1, Number(learning.streak) || 0) + 1
            : 1;
        learning.lastStudyDate = currentKey;
    }

    const durationMinutes = Math.max(
        0,
        Number(metadata.durationMinutes ?? metadata.details?.durationMinutes) || 0
    );
    if (durationMinutes > 0) {
        learning.totalStudyMinutes = Number((
            Math.max(0, Number(learning.totalStudyMinutes) || 0) + durationMinutes
        ).toFixed(2));
    }
}

function persistAndNotify(eventName = "state-updated", detail = {}) {
    storage.save();
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    if (eventName !== "state-updated") {
        window.dispatchEvent(new CustomEvent("state-updated", { detail: state.toJSON() }));
    }
}

export function resolveAchievementLanguage(languageValue = state.currentLanguage) {
    const code = normalizeLanguageCode(languageValue);
    const record = state.getLanguage?.(code) || null;
    const catalog = EF_LANGUAGES[code] || {};
    return {
        code,
        name: cleanText(record?.name || catalog.name, code ? code.toUpperCase() : "Idioma"),
        nativeName: cleanText(NATIVE_LANGUAGE_NAMES[code], catalog.name || "Idioma"),
        flag: cleanText(record?.flag || catalog.flag, "🌍"),
        country: cleanText(record?.country || catalog.country)
    };
}

/**
 * Migra recompensas antigas para o livro-caixa de atividades e remove XP
 * que havia sido indevidamente associado a onboarding, seleção de trilha ou
 * desbloqueio de uma conquista. Depois da migração, XP vem apenas do ledger.
 */
export function synchronizeAchievementRewards() {
    ensureAchievementState();

    const legacyAchievementRewardTotal = state.profile.achievements.reduce(
        (sum, record) => sum + Math.max(
            0,
            Number(record?.xp)
                || Number(record?.legacyXP)
                || Number(record?.xpBeforeMigration)
                || Number(record?.metadata?.legacyReward)
                || Number(record?.metadata?.xp)
                || 0
        ),
        0
    );

    state.profile.achievements.forEach((record) => {
        record.xp = 0;
        record.xpEarned = Math.max(0, Number(record.xpEarned) || 0);
    });

    if (state.profile.xpLedger.length === 0) {
        const explicitActivityXP = Math.max(0, Number(state.profile.activityXP) || 0);
        const inferred = explicitActivityXP > 0
            ? explicitActivityXP
            : Math.max(0, state.profile.xp - legacyAchievementRewardTotal);

        if (inferred > 0) {
            state.profile.xpLedger.push({
                id: "migration-legacy-activity-xp",
                idempotencyKey: "migration-legacy-activity-xp",
                amount: inferred,
                reason: "Migração de XP de atividades anteriores",
                languageCode: "",
                activity: "migration",
                earnedAt: new Date().toISOString()
            });
        }
    }

    const total = state.profile.xpLedger.reduce(
        (sum, entry) => sum + Math.max(0, Number(entry?.amount) || 0),
        0
    );
    state.profile.activityXP = total;
    state.profile.xp = total;
    storage.save();
    return total;
}

export function addActivityXP(amount, metadata = {}) {
    ensureAchievementState();
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    const idempotencyKey = cleanText(metadata.idempotencyKey);

    if (!value || !idempotencyKey) {
        if (!idempotencyKey && value) {
            console.warn("XP não registrado: informe metadata.idempotencyKey para impedir duplicidade.");
        }
        return { awarded: false, amount: 0, total: state.profile.xp };
    }

    const duplicate = state.profile.xpLedger.some(
        (entry) => entry?.idempotencyKey === idempotencyKey
    );
    if (duplicate) return { awarded: false, amount: 0, total: state.profile.xp };

    const languageCode = normalizeLanguageCode(metadata.languageCode || state.currentLanguage);
    const activityMetadata = metadata.activity && typeof metadata.activity === "object"
        ? metadata.activity
        : {};
    const entry = {
        id: makeId("xp"),
        idempotencyKey,
        amount: value,
        reason: cleanText(metadata.reason || activityMetadata.title, "Atividade concluída"),
        activity: cleanText(activityMetadata.type || metadata.activity, metadata.reason || "activity"),
        languageCode,
        earnedAt: cleanText(metadata.earnedAt, new Date().toISOString()),
        metadata: metadata.details && typeof metadata.details === "object" ? clone(metadata.details) : {}
    };

    state.profile.xpLedger.push(entry);
    state.profile.activityXP += value;
    state.profile.xp += value;

    if (languageCode) {
        const language = state.getLanguage?.(languageCode);
        if (language) language.xp = Math.max(0, Number(language.xp) || 0) + value;
    }

    state.profile.learning.recentActivities.unshift({
        id: entry.id,
        type: entry.activity,
        label: entry.reason,
        languageCode,
        xp: value,
        completedAt: entry.earnedAt
    });
    state.profile.learning.recentActivities = state.profile.learning.recentActivities.slice(0, 50);
    updateLearningActivityMetrics(entry.earnedAt, metadata);

    persistAndNotify("xp-earned", { amount: value, total: state.profile.xp, entry: clone(entry) });
    return { awarded: true, amount: value, total: state.profile.xp, entry };
}

function createAchievementKey(achievement, languageCode) {
    return achievement.scope === "language"
        ? `${achievement.id}:${languageCode}`
        : achievement.id;
}

function alreadyUnlocked(key) {
    return state.profile.achievements.some((record) => record?.key === key);
}

function baseRecord({ id, key, type, category, icon, title, description, language, unlockedAt, metadata }) {
    const avatar = state.profile.avatar || {};
    return {
        id,
        key,
        type: cleanText(type, "learning"),
        category: cleanText(category, "aprendizagem"),
        icon: cleanText(icon, "✨"),
        title: cleanText(title, "Conquista desbloqueada"),
        description: cleanText(description, "Uma nova etapa foi registrada."),
        userName: cleanText(state.profile.name, "Estudante"),
        avatar: {
            source: cleanText(avatar.source, "generated"),
            style: cleanText(avatar.style, "estudo-flex-classic"),
            imageUrl: cleanText(avatar.imageUrl, "./assets/avatars/default-user.svg"),
            description: cleanText(avatar.description)
        },
        language: language?.code ? clone(language) : null,
        unlockedAt: cleanText(unlockedAt, new Date().toISOString()),
        xp: 0,
        xpEarned: Math.max(0, Number(metadata?.xpEarned) || 0),
        streakDays: Math.max(0, Number(metadata?.streakDays ?? state.profile.learning?.streak) || 0),
        illustration: cleanText(metadata?.illustration || metadata?.imageUrl),
        imageAlt: cleanText(metadata?.imageAlt, title || "Ilustração da conquista"),
        sourceEvidence: cleanText(metadata?.sourceEvidence),
        shareMessage: cleanText(
            metadata?.shareMessage,
            `${cleanText(state.profile.name, "Estudante")} desbloqueou “${cleanText(title, "uma conquista")}” no Estudo Flex Languages.`
        ),
        metadata: metadata && typeof metadata === "object" ? clone(metadata) : {},
        unlocked: true
    };
}

export function unlockAchievement(achievementId, options = {}) {
    ensureAchievementState();
    const achievement = getAchievementById(achievementId);
    if (!achievement) return null;

    const language = resolveAchievementLanguage(options.language || options.languageCode);
    if (achievement.scope === "language" && !language.code) return null;
    const key = createAchievementKey(achievement, language.code);
    if (alreadyUnlocked(key)) return null;

    const record = baseRecord({
        id: achievement.id,
        key,
        type: achievement.type,
        category: achievement.category,
        icon: achievement.icon,
        title: achievement.title,
        description: achievement.description,
        language: achievement.scope === "language" ? language : null,
        unlockedAt: options.unlockedAt,
        metadata: options.metadata
    });
    state.profile.achievements.push(record);
    persistAndNotify("achievement-unlocked", { achievement: clone(record) });
    return record;
}

export function validateAchievementConsistency(achievement) {
    const errors = [];
    const code = normalizeLanguageCode(achievement?.language?.code || achievement?.languageCode);
    const combinedText = `${achievement?.title || ""} ${achievement?.description || ""}`.toLocaleLowerCase("pt-BR");

    if (!cleanText(achievement?.title)) errors.push("Título ausente.");
    if (!cleanText(achievement?.description)) errors.push("Descrição ausente.");
    if (!cleanText(achievement?.userName || state.profile.name)) errors.push("Nome do estudante ausente.");
    if (!code) errors.push("Idioma ausente.");

    Object.entries(LANGUAGE_TERMS).forEach(([termCode, terms]) => {
        const mentions = terms.some((term) => combinedText.includes(term));
        if (mentions && termCode !== code) {
            errors.push(`O texto menciona ${termCode}, mas a conquista está vinculada a ${code}.`);
        }
    });

    if (achievement?.requiresEvidence && !cleanText(achievement?.sourceEvidence)) {
        errors.push("A conquista exige uma evidência literal da atividade.");
    }

    return { valid: errors.length === 0, errors };
}

export function registerDynamicAchievement(payload = {}) {
    ensureAchievementState();
    const language = resolveAchievementLanguage(payload.languageCode || payload.language);
    const candidate = {
        ...payload,
        userName: cleanText(payload.userName, state.profile.name),
        language,
        sourceEvidence: cleanText(payload.sourceEvidence)
    };
    const consistency = validateAchievementConsistency(candidate);
    if (!consistency.valid) return { record: null, errors: consistency.errors };

    const id = cleanText(payload.id, makeId("achievement"));
    const key = cleanText(payload.key, id);
    if (alreadyUnlocked(key)) return { record: null, errors: ["Conquista já registrada."] };

    const record = baseRecord({
        id,
        key,
        type: payload.type,
        category: payload.category,
        icon: payload.icon,
        title: payload.title,
        description: payload.description,
        language,
        unlockedAt: payload.unlockedAt,
        metadata: {
            ...payload.metadata,
            xpEarned: payload.xpEarned,
            streakDays: payload.streakDays,
            illustration: payload.illustration,
            imageUrl: payload.imageUrl,
            imageAlt: payload.imageAlt,
            sourceEvidence: payload.sourceEvidence,
            shareMessage: payload.shareMessage,
            sceneType: payload.sceneType,
            country: payload.country || language.country
        }
    });
    record.sourceEvidence = cleanText(payload.sourceEvidence);
    record.requiresEvidence = Boolean(payload.requiresEvidence);
    state.profile.achievements.push(record);
    persistAndNotify("achievement-unlocked", { achievement: clone(record) });
    return { record, errors: [] };
}

export async function registerConversationAchievementCandidate(candidate = {}, context = {}) {
    const languageCode = normalizeLanguageCode(candidate.languageCode || context.languageCode || state.currentLanguage);
    const sourceQuote = cleanText(context.sourceQuote || candidate.sourceEvidence);
    const completed = candidate.completed === true || candidate.achievementDetected === true;

    if (!completed || sourceQuote.length < 6 || !languageCode) return null;
    if (normalizeLanguageCode(context.languageCode) && normalizeLanguageCode(context.languageCode) !== languageCode) return null;

    const result = registerDynamicAchievement({
        id: cleanText(candidate.id, makeId(`conversation-${languageCode}`)),
        type: cleanText(candidate.type, "real-world-interaction"),
        category: cleanText(candidate.category, "experiência real"),
        icon: cleanText(candidate.icon, "🌍"),
        languageCode,
        title: candidate.title,
        description: candidate.description,
        sceneType: candidate.sceneType,
        sourceEvidence: sourceQuote,
        requiresEvidence: true,
        xpEarned: Math.max(0, Number(candidate.xpEarned) || 0),
        imageAlt: candidate.imageAlt,
        shareMessage: candidate.shareMessage,
        metadata: { origin: "mentor-conversation", confidence: Number(candidate.confidence) || 0 }
    });
    return result.record;
}

export function checkMetricAchievements(metric, currentValue, options = {}) {
    const value = Number(currentValue);
    if (!Number.isFinite(value)) return [];
    return ACHIEVEMENT_CATALOG
        .filter((item) => item.requirement?.metric === metric && value >= Number(item.requirement.target))
        .map((item) => unlockAchievement(item.id, options))
        .filter(Boolean);
}

export function checkValueAchievements(metric, currentValue, options = {}) {
    const value = cleanText(currentValue).toLocaleLowerCase("pt-BR");
    return ACHIEVEMENT_CATALOG
        .filter((item) => item.requirement?.metric === metric
            && cleanText(item.requirement.value).toLocaleLowerCase("pt-BR") === value)
        .map((item) => unlockAchievement(item.id, options))
        .filter(Boolean);
}

export function registerAchievementEvent(eventName, options = {}) {
    const event = cleanText(eventName);
    if (!event) return [];
    return ACHIEVEMENT_CATALOG
        .filter((item) => item.requirement?.event === event)
        .map((item) => unlockAchievement(item.id, options))
        .filter(Boolean);
}

export function isAchievementUnlocked(achievementId, languageValue = state.currentLanguage) {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return false;
    const language = resolveAchievementLanguage(languageValue);
    return alreadyUnlocked(createAchievementKey(achievement, language.code));
}

export function getUnlockedAchievements() {
    ensureAchievementState();
    return clone(state.profile.achievements);
}
