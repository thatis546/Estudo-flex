import { getJourney, getJourneyLabel, journeyFromLegacyCefr } from "../data/journeys.js";
import { EF_LANGUAGES } from "../data/languages.js";
import { canonicalizeProfileOption, getPurposeSummary } from "./profile-options.js";

const STATE_SCHEMA_VERSION = 9;
const THEMES = new Set(["light", "dark", "system"]);
const TOP_LEVEL_KEYS = new Set(["schemaVersion", "user", "profile", "languages", "currentLanguage", "settings"]);

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function text(value) {
    return typeof value === "string" ? value.trim() : "";
}

function stringList(value) {
    return Array.isArray(value) ? [...new Set(value.map(text).filter(Boolean))] : [];
}

function normalizeLanguageCode(value) {
    const raw = isPlainObject(value) ? value.code || value.id || "" : value;
    return text(String(raw ?? "")).toLowerCase();
}

function createEmptyDiagnosticResult() {
    return {
        journeyId: "",
        journeyLabel: "",
        score: 0,
        confidence: 0,
        strengths: [],
        developmentAreas: [],
        evidence: {},
        completedAt: null,
        version: 2
    };
}

function createEmptyLanguageProfile(globalProfile = {}) {
    const source = isPlainObject(globalProfile) ? globalProfile : {};
    const details = isPlainObject(source.goalDetails) ? source.goalDetails : {};
    const goal = canonicalizeProfileOption("goal", source.goal);
    const purpose = getPurposeSummary(goal);
    return {
        goal,
        goalDescription: text(source.goalDescription) || purpose?.goalDescription || "",
        useCase: text(source.useCase) || purpose?.useCase || "",
        contact: canonicalizeProfileOption("contact", source.contact),
        dailyMinutes: Math.max(0, toNumber(source.dailyMinutes, 0)),
        lifeContext: canonicalizeProfileOption("lifeContext", source.lifeContext || purpose?.lifeContext),
        learningStyle: canonicalizeProfileOption("learningStyle", source.learningStyle),
        supportMode: text(source.supportMode) || "pt",
        goalDetails: {
            deadline: text(details.deadline),
            frequency: text(details.frequency),
            interests: stringList(details.interests)
        }
    };
}

function createEmptyProfessionalState() {
    return {
        selectedTrack: "",
        tracks: {}
    };
}

function createEmptyCommunicationState() {
    return {
        selectedModule: "pronunciation",
        reports: [],
        settings: {
            transcriptLanguage: "auto",
            keepAudio: false
        }
    };
}

function createInitialState() {
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
        user: {},
        profile: {
            name: "",
            nativeLanguage: "pt-BR",
            language: "",
            supportMode: "pt",
            goal: "",
            goalDescription: "",
            useCase: "",
            contact: "",
            dailyMinutes: 0,
            lifeContext: "",
            learningStyle: "",
            onboardingComplete: false,
            onboardingTutorialSeen: false,
            onboardingProgress: { step: 0, paused: false, updatedAt: null },
            goalDetails: { deadline: "", frequency: "", interests: [] },
            journeyId: "",
            journeyLabel: "",
            level: 0,
            levelTag: "",
            diagnosticScore: 0,
            diagnosticAnswers: [],
            diagnosticProgress: { step: 0, answers: [], scores: [], questionIds: [] },
            levelResult: createEmptyDiagnosticResult(),
            dailyPlan: { review: "", lesson: "", communication: "" },
            achievements: [],
            xp: 0,
            activityXP: 0,
            xpLedger: [],
            avatar: {
                source: "generated",
                style: "estudo-flex-classic",
                imageUrl: "./assets/avatars/default-user.svg",
                description: "",
                validated: true,
                validation: { hasSingleFace: true, illustrated: true, checkedAt: null }
            },
            mentor: {
                personality: "guided",
                mood: "friendly",
                speed: "normal",
                correctionStyle: "final",
                humor: 0.8,
                sarcasm: 0.1
            },
            aiMemory: {
                enabled: true,
                items: [],
                blockedFingerprints: []
            },
            learning: {
                streak: 0,
                totalStudyMinutes: 0,
                lastStudyDate: null,
                pendingReviews: [],
                weakTopics: [],
                masteredTopics: [],
                recentActivities: []
            }
        },
        languages: [],
        currentLanguage: "",
        settings: { theme: "light" }
    };
}

function normalizeDiagnosticResult(value, fallbackJourney = "") {
    const source = isPlainObject(value) ? value : {};
    const legacy = source.cefr || source.levelTag || "";
    const journeyId = text(source.journeyId) || text(fallbackJourney) || (legacy ? journeyFromLegacyCefr(legacy) : "");
    const journey = journeyId ? getJourney(journeyId) : null;
    return {
        ...createEmptyDiagnosticResult(),
        ...source,
        journeyId: journey?.id || "",
        journeyLabel: journey?.label || "",
        score: Math.max(0, toNumber(source.score, 0)),
        confidence: Math.min(1, Math.max(0, toNumber(source.confidence, 0))),
        strengths: stringList(source.strengths),
        developmentAreas: stringList(source.developmentAreas || source.weaknesses),
        evidence: isPlainObject(source.evidence) ? clone(source.evidence) : {},
        completedAt: text(source.completedAt) || null,
        version: Math.max(2, Math.floor(toNumber(source.version, 2)))
    };
}

function normalizeLearningProfile(value, globalProfile = {}) {
    const defaults = createEmptyLanguageProfile(globalProfile);
    const source = isPlainObject(value) ? value : {};
    const goalDetails = isPlainObject(source.goalDetails) ? source.goalDetails : {};
    const goal = canonicalizeProfileOption("goal", source.goal || globalProfile.goal);
    const purpose = getPurposeSummary(goal);
    return {
        ...defaults,
        ...source,
        goal,
        goalDescription: text(source.goalDescription) || purpose?.goalDescription || "",
        useCase: text(source.useCase) || purpose?.useCase || "",
        contact: canonicalizeProfileOption("contact", source.contact || globalProfile.contact),
        dailyMinutes: Math.max(0, toNumber(source.dailyMinutes ?? globalProfile.dailyMinutes, 0)),
        lifeContext: canonicalizeProfileOption("lifeContext", source.lifeContext || purpose?.lifeContext || globalProfile.lifeContext),
        learningStyle: canonicalizeProfileOption("learningStyle", source.learningStyle || globalProfile.learningStyle),
        supportMode: text(source.supportMode || globalProfile.supportMode) || "pt",
        goalDetails: {
            ...defaults.goalDetails,
            ...goalDetails,
            deadline: text(goalDetails.deadline),
            frequency: text(goalDetails.frequency),
            interests: stringList(goalDetails.interests)
        }
    };
}

function normalizeProfessional(value) {
    const source = isPlainObject(value) ? value : {};
    const tracks = isPlainObject(source.tracks) ? clone(source.tracks) : {};
    // Migração da estrutura antiga de uma única trilha.
    const legacyTrack = text(source.selectedTrack || source.track);
    if (legacyTrack && !tracks[legacyTrack]) {
        tracks[legacyTrack] = {
            progress: isPlainObject(source.progress) ? clone(source.progress) : {},
            completedModules: stringList(source.completedModules),
            unlockedModules: stringList(source.unlockedModules),
            responses: {},
            updatedAt: null
        };
    }
    return { selectedTrack: legacyTrack, tracks };
}

function normalizeCommunication(value) {
    const source = isPlainObject(value) ? value : {};
    const settings = isPlainObject(source.settings) ? source.settings : {};
    return {
        selectedModule: text(source.selectedModule) || "pronunciation",
        reports: Array.isArray(source.reports) ? clone(source.reports).slice(0, 100) : [],
        settings: {
            transcriptLanguage: text(settings.transcriptLanguage) || "auto",
            keepAudio: Boolean(settings.keepAudio)
        }
    };
}

function normalizeLanguageRecord(record, globalProfile = {}) {
    if (!isPlainObject(record)) return null;
    const code = normalizeLanguageCode(record);
    if (!code) return null;

    const legacyJourney = text(record.journeyId) || (record.level ? journeyFromLegacyCefr(record.level) : "");
    const diagnosticResult = normalizeDiagnosticResult(record.diagnosticResult || record.levelResult, legacyJourney);
    const journeyId = diagnosticResult.completedAt ? diagnosticResult.journeyId : "";
    const stats = isPlainObject(record.stats) ? record.stats : {};
    const progress = isPlainObject(record.diagnosticProgress) ? record.diagnosticProgress : {};
    const dailyPlan = isPlainObject(record.dailyPlan) ? record.dailyPlan : {};
    const setupComplete = Boolean(record.setupComplete && diagnosticResult.completedAt && journeyId);

    return {
        ...record,
        code,
        name: text(record.name || record.label) || code.toUpperCase(),
        flag: text(record.flag) || "🌍",
        country: text(record.country),
        mentor: text(record.mentor),
        journeyId,
        journeyLabel: journeyId ? getJourneyLabel(journeyId) : "",
        level: journeyId ? getJourneyLabel(journeyId) : "",
        setupComplete,
        setupStatus: setupComplete ? "ready" : text(record.setupStatus) || "setup-required",
        learningProfile: normalizeLearningProfile(record.learningProfile, globalProfile),
        diagnosticResult,
        levelResult: diagnosticResult,
        diagnosticScore: diagnosticResult.score,
        diagnosticAnswers: Array.isArray(record.diagnosticAnswers) ? clone(record.diagnosticAnswers) : [],
        diagnosticProgress: {
            step: Math.max(0, Math.floor(toNumber(progress.step, 0))),
            answers: Array.isArray(progress.answers) ? clone(progress.answers) : [],
            scores: Array.isArray(progress.scores) ? progress.scores.map((item) => toNumber(item, 0)) : [],
            questionIds: stringList(progress.questionIds)
        },
        dailyPlan: {
            review: text(dailyPlan.review),
            lesson: text(dailyPlan.lesson),
            communication: text(dailyPlan.communication || dailyPlan.conversation)
        },
        reviewQueue: Array.isArray(record.reviewQueue)
            ? clone(record.reviewQueue).filter((item) => item?.sourceActivityId && item?.introducedAt)
            : [],
        activityHistory: Array.isArray(record.activityHistory) ? clone(record.activityHistory).slice(0, 100) : [],
        professional: normalizeProfessional(record.professional),
        communicationLab: normalizeCommunication(record.communicationLab),
        xp: Math.max(0, toNumber(record.xp, 0)),
        progress: Math.min(100, Math.max(0, toNumber(record.progress, 0))),
        stats: {
            knownWords: Math.max(0, toNumber(stats.knownWords, 0)),
            lessonsCompleted: Math.max(0, toNumber(stats.lessonsCompleted, 0)),
            reviewsCompleted: Math.max(0, toNumber(stats.reviewsCompleted, 0)),
            speakingMinutes: Math.max(0, toNumber(stats.speakingMinutes || (stats.conversationSeconds / 60), 0)),
            communicationSessions: Math.max(0, toNumber(stats.communicationSessions || stats.conversationsCompleted, 0)),
            recordedAudioBytes: Math.max(0, toNumber(stats.recordedAudioBytes, 0))
        }
    };
}

class State {
    constructor() { this.reset(); }

    reset() {
        Object.assign(this, clone(createInitialState()));
        return this;
    }

    initialize(savedState = null) {
        const source = isPlainObject(savedState) ? savedState : {};
        const defaults = createInitialState();
        const sourceProfile = isPlainObject(source.profile) ? source.profile : {};
        const legacyJourney = text(sourceProfile.journeyId) || (sourceProfile.levelTag ? journeyFromLegacyCefr(sourceProfile.levelTag) : "");
        const profileResult = normalizeDiagnosticResult(sourceProfile.diagnosticResult || sourceProfile.levelResult, legacyJourney);
        const avatar = isPlainObject(sourceProfile.avatar) ? sourceProfile.avatar : {};
        const aiMemory = isPlainObject(sourceProfile.aiMemory) ? sourceProfile.aiMemory : {};
        const learning = isPlainObject(sourceProfile.learning) ? sourceProfile.learning : {};

        this.schemaVersion = STATE_SCHEMA_VERSION;
        this.user = isPlainObject(source.user) ? clone(source.user) : {};
        this.profile = {
            ...defaults.profile,
            ...sourceProfile,
            name: text(sourceProfile.name),
            nativeLanguage: text(sourceProfile.nativeLanguage) || "pt-BR",
            language: normalizeLanguageCode(sourceProfile.language),
            supportMode: text(sourceProfile.supportMode) || "pt",
            goal: canonicalizeProfileOption("goal", sourceProfile.goal),
            goalDescription: text(sourceProfile.goalDescription),
            useCase: text(sourceProfile.useCase),
            contact: canonicalizeProfileOption("contact", sourceProfile.contact),
            dailyMinutes: Math.max(0, toNumber(sourceProfile.dailyMinutes, 0)),
            lifeContext: canonicalizeProfileOption("lifeContext", sourceProfile.lifeContext),
            learningStyle: canonicalizeProfileOption("learningStyle", sourceProfile.learningStyle),
            onboardingComplete: Boolean(sourceProfile.onboardingComplete),
            onboardingTutorialSeen: Boolean(sourceProfile.onboardingTutorialSeen),
            onboardingProgress: {
                ...defaults.profile.onboardingProgress,
                ...(isPlainObject(sourceProfile.onboardingProgress) ? sourceProfile.onboardingProgress : {}),
                step: Math.max(0, Math.floor(toNumber(sourceProfile.onboardingProgress?.step, 0)))
            },
            goalDetails: {
                ...defaults.profile.goalDetails,
                ...(isPlainObject(sourceProfile.goalDetails) ? sourceProfile.goalDetails : {}),
                interests: stringList(sourceProfile.goalDetails?.interests)
            },
            journeyId: profileResult.completedAt ? profileResult.journeyId : "",
            journeyLabel: profileResult.completedAt ? profileResult.journeyLabel : "",
            level: profileResult.completedAt ? getJourney(profileResult.journeyId).order : 0,
            levelTag: profileResult.completedAt ? profileResult.journeyLabel : "",
            diagnosticScore: profileResult.score,
            diagnosticAnswers: Array.isArray(sourceProfile.diagnosticAnswers) ? clone(sourceProfile.diagnosticAnswers) : [],
            diagnosticProgress: {
                ...defaults.profile.diagnosticProgress,
                ...(isPlainObject(sourceProfile.diagnosticProgress) ? sourceProfile.diagnosticProgress : {}),
                answers: Array.isArray(sourceProfile.diagnosticProgress?.answers) ? clone(sourceProfile.diagnosticProgress.answers) : [],
                scores: Array.isArray(sourceProfile.diagnosticProgress?.scores) ? sourceProfile.diagnosticProgress.scores.map((item) => toNumber(item, 0)) : [],
                questionIds: stringList(sourceProfile.diagnosticProgress?.questionIds)
            },
            levelResult: profileResult,
            dailyPlan: {
                ...defaults.profile.dailyPlan,
                ...(isPlainObject(sourceProfile.dailyPlan) ? sourceProfile.dailyPlan : {}),
                communication: text(sourceProfile.dailyPlan?.communication || sourceProfile.dailyPlan?.conversation)
            },
            achievements: Array.isArray(sourceProfile.achievements) ? clone(sourceProfile.achievements) : [],
            xp: Math.max(0, toNumber(sourceProfile.xp, 0)),
            activityXP: Math.max(0, toNumber(sourceProfile.activityXP, sourceProfile.xp || 0)),
            xpLedger: Array.isArray(sourceProfile.xpLedger) ? clone(sourceProfile.xpLedger) : [],
            avatar: {
                ...defaults.profile.avatar,
                ...avatar,
                source: text(avatar.source) || defaults.profile.avatar.source,
                style: text(avatar.style) || defaults.profile.avatar.style,
                imageUrl: text(avatar.imageUrl) || defaults.profile.avatar.imageUrl,
                description: text(avatar.description),
                validated: avatar.validated !== false,
                validation: isPlainObject(avatar.validation) ? clone(avatar.validation) : clone(defaults.profile.avatar.validation)
            },
            mentor: {
                ...defaults.profile.mentor,
                ...(isPlainObject(sourceProfile.mentor) ? sourceProfile.mentor : {})
            },
            aiMemory: {
                enabled: aiMemory.enabled !== false,
                items: Array.isArray(aiMemory.items) ? clone(aiMemory.items) : [],
                blockedFingerprints: stringList(aiMemory.blockedFingerprints)
            },
            learning: {
                ...defaults.profile.learning,
                ...learning,
                streak: Math.max(0, toNumber(learning.streak, 0)),
                totalStudyMinutes: Math.max(0, toNumber(learning.totalStudyMinutes, 0)),
                pendingReviews: Array.isArray(learning.pendingReviews) ? clone(learning.pendingReviews) : [],
                weakTopics: stringList(learning.weakTopics),
                masteredTopics: stringList(learning.masteredTopics),
                recentActivities: Array.isArray(learning.recentActivities) ? clone(learning.recentActivities).slice(0, 50) : []
            }
        };

        const profilePurpose = getPurposeSummary(this.profile.goal);
        if (profilePurpose) {
            if (!this.profile.goalDescription) this.profile.goalDescription = profilePurpose.goalDescription;
            if (!this.profile.useCase) this.profile.useCase = profilePurpose.useCase;
            if (!this.profile.lifeContext) this.profile.lifeContext = profilePurpose.lifeContext;
        }

        this.languages = (Array.isArray(source.languages) ? source.languages : [])
            .map((record) => normalizeLanguageRecord(record, this.profile))
            .filter(Boolean);
        this.languages = [...new Map(this.languages.map((item) => [item.code, item])).values()];

        const requested = normalizeLanguageCode(source.currentLanguage || sourceProfile.language);
        if (requested && EF_LANGUAGES[requested] && !this.languages.some((item) => item.code === requested)) {
            const configuration = EF_LANGUAGES[requested];
            const migratedRecord = normalizeLanguageRecord({
                code: requested,
                name: configuration.name,
                flag: configuration.flag,
                country: configuration.country,
                mentor: configuration.mentor,
                setupComplete: Boolean(profileResult.completedAt),
                setupStatus: profileResult.completedAt ? "ready" : "setup-required",
                learningProfile: {
                    goal: this.profile.goal,
                    goalDescription: this.profile.goalDescription,
                    useCase: this.profile.useCase,
                    contact: this.profile.contact,
                    dailyMinutes: this.profile.dailyMinutes,
                    lifeContext: this.profile.lifeContext,
                    learningStyle: this.profile.learningStyle,
                    goalDetails: clone(this.profile.goalDetails)
                },
                diagnosticResult: profileResult,
                diagnosticAnswers: clone(this.profile.diagnosticAnswers),
                dailyPlan: clone(this.profile.dailyPlan),
                stats: {}
            }, this.profile);
            if (migratedRecord) this.languages.push(migratedRecord);
        }

        this.currentLanguage = this.languages.some((item) => item.code === requested)
            ? requested
            : this.languages[0]?.code || "";
        this.profile.language = this.currentLanguage;

        const active = this.getLanguage();
        if (active) this.syncProfileCompatibility(active);

        const settings = isPlainObject(source.settings) ? source.settings : {};
        const theme = text(settings.theme).toLowerCase();
        this.settings = { ...defaults.settings, ...settings, theme: THEMES.has(theme) ? theme : "light" };
        return this;
    }

    syncProfileCompatibility(record) {
        const learningProfile = record.learningProfile || createEmptyLanguageProfile(this.profile);
        const onboardingInProgress = !this.profile.onboardingComplete;
        const chooseText = (recordValue, profileValue) => {
            const normalized = text(recordValue);
            return normalized || (onboardingInProgress ? text(profileValue) : "");
        };
        const recordDetails = isPlainObject(learningProfile.goalDetails) ? learningProfile.goalDetails : {};
        const profileDetails = isPlainObject(this.profile.goalDetails) ? this.profile.goalDetails : {};
        this.profile.language = record.code;
        this.profile.goal = chooseText(learningProfile.goal, this.profile.goal);
        this.profile.goalDescription = chooseText(learningProfile.goalDescription, this.profile.goalDescription);
        this.profile.useCase = chooseText(learningProfile.useCase, this.profile.useCase);
        this.profile.contact = chooseText(learningProfile.contact, this.profile.contact);
        this.profile.dailyMinutes = Math.max(0, toNumber(learningProfile.dailyMinutes, onboardingInProgress ? this.profile.dailyMinutes : 0));
        this.profile.lifeContext = chooseText(learningProfile.lifeContext, this.profile.lifeContext);
        this.profile.learningStyle = chooseText(learningProfile.learningStyle, this.profile.learningStyle);
        this.profile.supportMode = chooseText(learningProfile.supportMode, this.profile.supportMode) || "pt";
        this.profile.goalDetails = {
            deadline: chooseText(recordDetails.deadline, profileDetails.deadline),
            frequency: chooseText(recordDetails.frequency, profileDetails.frequency),
            interests: stringList(recordDetails.interests).length
                ? stringList(recordDetails.interests)
                : (onboardingInProgress ? stringList(profileDetails.interests) : [])
        };
        this.profile.journeyId = record.journeyId || "";
        this.profile.journeyLabel = record.journeyLabel || "";
        this.profile.levelTag = record.journeyLabel || "";
        this.profile.level = record.journeyId ? getJourney(record.journeyId).order : 0;
        this.profile.levelResult = clone(record.diagnosticResult || createEmptyDiagnosticResult());
        this.profile.diagnosticScore = record.diagnosticResult?.score || 0;
        this.profile.diagnosticAnswers = clone(record.diagnosticAnswers || []);
        this.profile.dailyPlan = clone(record.dailyPlan || { review: "", lesson: "", communication: "" });
    }

    set(key, value) {
        if (!TOP_LEVEL_KEYS.has(key)) return false;
        if (key === "profile") this.updateProfile(value);
        else if (key === "languages") this.languages = (Array.isArray(value) ? value : []).map((record) => normalizeLanguageRecord(record, this.profile)).filter(Boolean);
        else if (key === "currentLanguage") return this.setCurrentLanguage(value);
        else if (key === "settings") this.updateSettings(value);
        else if (key === "user") this.user = isPlainObject(value) ? clone(value) : {};
        return true;
    }

    get(key) { return TOP_LEVEL_KEYS.has(key) ? this[key] : undefined; }

    updateProfile(patch = {}) {
        if (!isPlainObject(patch)) return this.profile;
        this.profile = {
            ...this.profile,
            ...patch,
            goalDetails: patch.goalDetails ? { ...this.profile.goalDetails, ...patch.goalDetails, interests: patch.goalDetails.interests ? stringList(patch.goalDetails.interests) : this.profile.goalDetails.interests } : this.profile.goalDetails,
            onboardingProgress: patch.onboardingProgress ? { ...this.profile.onboardingProgress, ...patch.onboardingProgress } : this.profile.onboardingProgress,
            diagnosticProgress: patch.diagnosticProgress ? { ...this.profile.diagnosticProgress, ...patch.diagnosticProgress, answers: patch.diagnosticProgress.answers ? clone(patch.diagnosticProgress.answers) : this.profile.diagnosticProgress.answers, scores: patch.diagnosticProgress.scores ? clone(patch.diagnosticProgress.scores) : this.profile.diagnosticProgress.scores, questionIds: patch.diagnosticProgress.questionIds ? stringList(patch.diagnosticProgress.questionIds) : this.profile.diagnosticProgress.questionIds } : this.profile.diagnosticProgress,
            levelResult: patch.levelResult ? normalizeDiagnosticResult({ ...this.profile.levelResult, ...patch.levelResult }, patch.journeyId || this.profile.journeyId) : this.profile.levelResult,
            dailyPlan: patch.dailyPlan ? { ...this.profile.dailyPlan, ...patch.dailyPlan } : this.profile.dailyPlan,
            mentor: patch.mentor ? { ...this.profile.mentor, ...patch.mentor } : this.profile.mentor,
            avatar: patch.avatar ? { ...this.profile.avatar, ...patch.avatar, validation: patch.avatar.validation ? { ...this.profile.avatar.validation, ...patch.avatar.validation } : this.profile.avatar.validation } : this.profile.avatar,
            aiMemory: patch.aiMemory ? { ...this.profile.aiMemory, ...patch.aiMemory, items: patch.aiMemory.items ? clone(patch.aiMemory.items) : this.profile.aiMemory.items, blockedFingerprints: patch.aiMemory.blockedFingerprints ? stringList(patch.aiMemory.blockedFingerprints) : this.profile.aiMemory.blockedFingerprints } : this.profile.aiMemory,
            learning: patch.learning ? { ...this.profile.learning, ...patch.learning, pendingReviews: patch.learning.pendingReviews ? clone(patch.learning.pendingReviews) : this.profile.learning.pendingReviews, weakTopics: patch.learning.weakTopics ? stringList(patch.learning.weakTopics) : this.profile.learning.weakTopics, masteredTopics: patch.learning.masteredTopics ? stringList(patch.learning.masteredTopics) : this.profile.learning.masteredTopics, recentActivities: patch.learning.recentActivities ? clone(patch.learning.recentActivities).slice(0, 50) : this.profile.learning.recentActivities } : this.profile.learning,
            achievements: patch.achievements ? clone(patch.achievements) : this.profile.achievements,
            xpLedger: patch.xpLedger ? clone(patch.xpLedger) : this.profile.xpLedger
        };
        this.profile.goal = canonicalizeProfileOption("goal", this.profile.goal);
        this.profile.contact = canonicalizeProfileOption("contact", this.profile.contact);
        this.profile.lifeContext = canonicalizeProfileOption("lifeContext", this.profile.lifeContext);
        this.profile.learningStyle = canonicalizeProfileOption("learningStyle", this.profile.learningStyle);
        const purpose = getPurposeSummary(this.profile.goal);
        if (purpose) {
            if (!this.profile.goalDescription) this.profile.goalDescription = purpose.goalDescription;
            if (!this.profile.useCase) this.profile.useCase = purpose.useCase;
            if (!this.profile.lifeContext) this.profile.lifeContext = purpose.lifeContext;
        }
        return this.profile;
    }

    updateSettings(patch = {}) {
        if (!isPlainObject(patch)) return this.settings;
        const next = { ...this.settings, ...patch };
        const theme = text(next.theme).toLowerCase();
        next.theme = THEMES.has(theme) ? theme : this.settings.theme || "light";
        this.settings = next;
        return this.settings;
    }

    updateDailyPlan(plan = {}) { return this.updateProfile({ dailyPlan: plan }).dailyPlan; }
    updateMentor(patch = {}) { return this.updateProfile({ mentor: patch }).mentor; }
    updateLearning(patch = {}) { return this.updateProfile({ learning: patch }).learning; }
    updateLevelResult(patch = {}) { return this.updateProfile({ levelResult: patch }).levelResult; }
    isOnboardingCompleted() { return Boolean(this.profile.onboardingComplete); }

    setCurrentLanguage(language) {
        const code = normalizeLanguageCode(language);
        if (!code) {
            this.currentLanguage = "";
            this.profile.language = "";
            return false;
        }
        this.currentLanguage = code;
        this.profile.language = code;
        const record = this.getLanguage(code);
        if (record) this.syncProfileCompatibility(record);
        return true;
    }

    addLanguage(language) {
        const normalized = normalizeLanguageRecord(language, this.profile);
        if (!normalized) return null;
        const index = this.languages.findIndex((item) => item.code === normalized.code);
        if (index < 0) {
            this.languages.push(normalized);
            return normalized;
        }
        const existing = this.languages[index];
        const merged = normalizeLanguageRecord({ ...existing, ...language }, this.profile);
        this.languages[index] = merged;
        return merged;
    }

    removeLanguage(code) {
        const normalized = normalizeLanguageCode(code);
        this.languages = this.languages.filter((item) => item.code !== normalized);
        if (this.currentLanguage === normalized) this.setCurrentLanguage(this.languages[0]?.code || "");
        return true;
    }

    getLanguage(code = this.currentLanguage) {
        const normalized = normalizeLanguageCode(code);
        return this.languages.find((item) => item.code === normalized) || null;
    }

    toJSON() {
        return clone({ schemaVersion: this.schemaVersion, user: this.user, profile: this.profile, languages: this.languages, currentLanguage: this.currentLanguage, settings: this.settings });
    }
}

export const state = new State();
export { STATE_SCHEMA_VERSION, createEmptyDiagnosticResult, createEmptyLanguageProfile, createEmptyProfessionalState, createEmptyCommunicationState };
