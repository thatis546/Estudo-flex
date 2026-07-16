import { state, createEmptyDiagnosticResult, createEmptyLanguageProfile, createEmptyProfessionalState, createEmptyCommunicationState } from "../core/state.js";
import { storage } from "../core/storage.js";
import { EF_LANGUAGES } from "../data/languages.js";
import { getJourneyLabel } from "../data/journeys.js";

function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function normalizeCode(value) {
    return String(value ?? "").trim().toLowerCase();
}

function emitLanguageChanged(record) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("language-changed", {
        detail: {
            code: record.code,
            language: EF_LANGUAGES[record.code],
            record,
            setupRequired: !isLanguageReady(record)
        }
    }));
}

export function ensureLanguageRecord(code) {
    const normalizedCode = normalizeCode(code);
    const configuration = EF_LANGUAGES[normalizedCode];
    if (!normalizedCode || !configuration) return null;

    const existing = state.getLanguage(normalizedCode);
    if (existing) return existing;

    return state.addLanguage({
        code: normalizedCode,
        name: configuration.name,
        flag: configuration.flag || "🌍",
        country: configuration.country || "",
        mentor: configuration.mentor || "",
        journeyId: "",
        journeyLabel: "",
        setupComplete: false,
        setupStatus: "setup-required",
        learningProfile: createEmptyLanguageProfile(state.profile),
        diagnosticResult: createEmptyDiagnosticResult(),
        diagnosticAnswers: [],
        diagnosticProgress: { step: 0, answers: [], scores: [], questionIds: [] },
        dailyPlan: { review: "", lesson: "", communication: "" },
        reviewQueue: [],
        professional: createEmptyProfessionalState(),
        communicationLab: createEmptyCommunicationState(),
        xp: 0,
        progress: 0,
        stats: {}
    });
}

export function getCurrentLanguageRecord() {
    return state.getLanguage(state.currentLanguage);
}

export function isLanguageReady(record = getCurrentLanguageRecord()) {
    return Boolean(record?.setupComplete && record?.journeyId && record?.diagnosticResult?.completedAt);
}

export function getLanguageLevelLabel(record = getCurrentLanguageRecord()) {
    return isLanguageReady(record) ? getJourneyLabel(record.journeyId) : "Diagnóstico pendente";
}

export function syncProfileFromLanguage(record = getCurrentLanguageRecord()) {
    if (!record) return null;
    state.syncProfileCompatibility(record);
    return record;
}

export function selectLanguage(code, { persist = true } = {}) {
    const record = ensureLanguageRecord(code);
    if (!record) return null;
    state.setCurrentLanguage(record.code);
    syncProfileFromLanguage(record);
    if (persist) storage.save();
    emitLanguageChanged(record);
    return record;
}

/**
 * Atualiza objetivo/contexto de um idioma sem apagar um diagnóstico já concluído.
 * O diagnóstico só é removido quando resetDiagnostic=true é informado explicitamente.
 */
export function saveLanguageSetup(patch = {}, { resetDiagnostic = false } = {}) {
    const record = getCurrentLanguageRecord();
    if (!record) return null;

    const current = record.learningProfile || createEmptyLanguageProfile(state.profile);
    const incomingGoalDetails = patch.goalDetails || {};
    record.learningProfile = {
        ...current,
        ...patch,
        goal: String(patch.goal ?? current.goal ?? "").trim(),
        goalDescription: String(patch.goalDescription ?? current.goalDescription ?? "").trim(),
        useCase: String(patch.useCase ?? current.useCase ?? "").trim(),
        contact: String(patch.contact ?? current.contact ?? "").trim(),
        lifeContext: String(patch.lifeContext ?? current.lifeContext ?? "").trim(),
        learningStyle: String(patch.learningStyle ?? current.learningStyle ?? "").trim(),
        dailyMinutes: Math.max(0, Number(patch.dailyMinutes ?? current.dailyMinutes) || 0),
        goalDetails: {
            ...current.goalDetails,
            ...incomingGoalDetails,
            deadline: String(incomingGoalDetails.deadline ?? current.goalDetails?.deadline ?? "").trim(),
            frequency: String(incomingGoalDetails.frequency ?? current.goalDetails?.frequency ?? "").trim(),
            interests: Array.isArray(incomingGoalDetails.interests)
                ? [...new Set(incomingGoalDetails.interests.map((item) => String(item).trim()).filter(Boolean))]
                : [...(current.goalDetails?.interests || [])]
        }
    };

    if (resetDiagnostic) {
        record.journeyId = "";
        record.journeyLabel = "";
        record.level = "";
        record.diagnosticResult = createEmptyDiagnosticResult();
        record.levelResult = record.diagnosticResult;
        record.diagnosticAnswers = [];
        record.diagnosticProgress = { step: 0, answers: [], scores: [], questionIds: [] };
        record.setupComplete = false;
        record.setupStatus = "diagnostic-required";
    } else if (!isLanguageReady(record)) {
        record.setupComplete = false;
        record.setupStatus = "diagnostic-required";
    }

    syncProfileFromLanguage(record);
    storage.save();
    return record;
}

export function resetLanguageDiagnostic(code = state.currentLanguage) {
    const record = state.getLanguage(code);
    if (!record) return null;
    record.journeyId = "";
    record.journeyLabel = "";
    record.level = "";
    record.diagnosticResult = createEmptyDiagnosticResult();
    record.levelResult = record.diagnosticResult;
    record.diagnosticAnswers = [];
    record.diagnosticProgress = { step: 0, answers: [], scores: [], questionIds: [] };
    record.setupComplete = false;
    record.setupStatus = "diagnostic-required";
    if (record.code === state.currentLanguage) syncProfileFromLanguage(record);
    storage.save();
    return record;
}

export function buildLanguageDailyPlan(record = getCurrentLanguageRecord()) {
    if (!record) return { review: "", lesson: "", communication: "" };
    const interests = record.learningProfile?.goalDetails?.interests || [];
    const interest = interests[0] || record.learningProfile?.useCase || "situações do dia a dia";
    const journey = record.journeyLabel || "Explorando";
    return {
        review: `Revisão rápida de ${record.name}`,
        lesson: `${journey}: conteúdo novo ligado a ${interest}`,
        communication: `Communication Lab de ${record.name}`
    };
}

export function saveLanguageDiagnostic(result = {}) {
    const record = getCurrentLanguageRecord();
    if (!record) return null;
    const completedAt = new Date().toISOString();
    record.journeyId = String(result.journeyId || "explorando").trim();
    record.journeyLabel = getJourneyLabel(record.journeyId);
    record.level = record.journeyLabel;
    record.diagnosticResult = {
        journeyId: record.journeyId,
        journeyLabel: record.journeyLabel,
        score: Number(result.score) || 0,
        confidence: Number(result.confidence) || 0,
        strengths: Array.isArray(result.strengths) ? [...result.strengths] : [],
        developmentAreas: Array.isArray(result.developmentAreas) ? [...result.developmentAreas] : [],
        evidence: result.evidence && typeof result.evidence === "object" ? clone(result.evidence) : {},
        completedAt,
        version: 2
    };
    record.levelResult = record.diagnosticResult;
    record.diagnosticScore = record.diagnosticResult.score;
    record.diagnosticAnswers = Array.isArray(result.answers) ? clone(result.answers) : [];
    record.diagnosticProgress = { step: 0, answers: [], scores: [], questionIds: [] };
    record.setupComplete = true;
    record.setupStatus = "ready";
    record.dailyPlan = buildLanguageDailyPlan(record);
    syncProfileFromLanguage(record);
    storage.save();

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("language-setup-completed", { detail: { record } }));
        window.dispatchEvent(new CustomEvent("state-updated", { detail: state.toJSON() }));
    }
    return record;
}

export function migrateInitialProfileToCurrentLanguage() {
    const code = state.profile?.language || state.currentLanguage;
    const record = ensureLanguageRecord(code);
    if (!record) return null;
    record.learningProfile = {
        ...createEmptyLanguageProfile(state.profile),
        goal: state.profile.goal || "",
        goalDescription: state.profile.goalDescription || "",
        useCase: state.profile.useCase || "",
        contact: state.profile.contact || "",
        dailyMinutes: Number(state.profile.dailyMinutes) || 0,
        lifeContext: state.profile.lifeContext || "",
        learningStyle: state.profile.learningStyle || "",
        goalDetails: clone(state.profile.goalDetails || {})
    };
    if (state.profile.levelResult?.completedAt && state.profile.levelResult?.journeyId) {
        record.journeyId = state.profile.levelResult.journeyId;
        record.journeyLabel = getJourneyLabel(record.journeyId);
        record.level = record.journeyLabel;
        record.diagnosticResult = clone(state.profile.levelResult);
        record.levelResult = record.diagnosticResult;
        record.setupComplete = true;
        record.setupStatus = "ready";
        record.dailyPlan = clone(state.profile.dailyPlan || buildLanguageDailyPlan(record));
    }
    storage.save();
    return record;
}
