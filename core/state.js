const STATE_SCHEMA_VERSION = 5;
const CEFR_LEVELS = new Set(["A0", "A1", "A2", "B1", "B2", "C1", "C2"]);
const THEMES = new Set(["light", "dark", "system"]);
const TOP_LEVEL_KEYS = new Set([
    "schemaVersion",
    "user",
    "profile",
    "languages",
    "currentLanguage",
    "settings"
]);

function createInitialState() {
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
        user: {},
        profile: {
            name: "",
            language: "",
            supportMode: "",
            goal: "",
            contact: "",
            dailyMinutes: 0,
            lifeContext: "",
            learningStyle: "",
            diagnosticScore: 0,
            onboardingComplete: false,
            achievements: [],
            xp: 0,
            goalDetails: {
                deadline: "",
                frequency: "",
                interests: []
            },
            onboardingProgress: {
                step: 0,
                paused: false,
                updatedAt: null
            },
            level: 1,
            levelTag: "A1",
            diagnosticAnswers: [],
            diagnosticProgress: {
                step: 0,
                answers: [],
                scores: [],
                currentDifficulty: 3
            },
            levelResult: {
                cefr: "A1",
                score: 0,
                confidence: 0,
                strengths: [],
                weaknesses: [],
                completedAt: null
            },
            dailyPlan: {
                review: "",
                lesson: "",
                conversation: ""
            },
            professionalTrack: "",
            professional: {
                track: null,
                progress: {},
                completedModules: [],
                unlockedModules: []
            },
            mentor: {
                personality: "guided",
                mood: "friendly",
                speed: "normal",
                correctionStyle: "immediate",
                humor: 0.8,
                sarcasm: 0.1,
                notes: []
            },
            learning: {
                streak: 0,
                totalStudyMinutes: 0,
                lastStudyDate: null,
                pendingReviews: [],
                weakTopics: [],
                masteredTopics: []
            }
        },
        languages: [],
        currentLanguage: "",
        settings: {
            theme: "light"
        }
    };
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function toFiniteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeLanguageCode(value) {
    const raw = isPlainObject(value)
        ? value.code || value.id || ""
        : value;
    return normalizeString(String(raw ?? "")).toLowerCase();
}

function normalizeCefr(value, fallback = "A1") {
    const level = normalizeString(String(value ?? "")).toUpperCase();
    return CEFR_LEVELS.has(level) ? level : fallback;
}

function normalizeLevelResult(value, fallbackLevel = "A1") {
    const source = isPlainObject(value) ? value : {};
    return {
        cefr: normalizeCefr(source.cefr, fallbackLevel),
        score: toFiniteNumber(source.score, 0),
        confidence: Math.min(1, Math.max(0, toFiniteNumber(source.confidence, 0))),
        strengths: Array.isArray(source.strengths) ? [...source.strengths] : [],
        weaknesses: Array.isArray(source.weaknesses) ? [...source.weaknesses] : [],
        completedAt: normalizeString(source.completedAt) || null
    };
}

function normalizeLanguageRecord(record) {
    if (!isPlainObject(record)) return null;
    const code = normalizeLanguageCode(record);
    if (!code) return null;

    const level = normalizeCefr(record.level, "A1");
    const stats = isPlainObject(record.stats) ? record.stats : {};
    return {
        ...record,
        code,
        name: normalizeString(record.name || record.label) || code.toUpperCase(),
        flag: normalizeString(record.flag) || "🌍",
        mentor: normalizeString(record.mentor),
        level,
        xp: Math.max(0, toFiniteNumber(record.xp, 0)),
        progress: Math.min(100, Math.max(0, toFiniteNumber(record.progress, 0))),
        diagnosticScore: toFiniteNumber(record.diagnosticScore, record.levelResult?.score || 0),
        diagnosticAnswers: Array.isArray(record.diagnosticAnswers)
            ? [...record.diagnosticAnswers]
            : [],
        levelResult: normalizeLevelResult(record.levelResult, level),
        stats: {
            ...stats,
            knownWords: Math.max(0, toFiniteNumber(stats.knownWords, 0)),
            lessonsCompleted: Math.max(0, toFiniteNumber(stats.lessonsCompleted, 0)),
            conversationSeconds: Math.max(0, toFiniteNumber(stats.conversationSeconds, 0)),
            conversationsCompleted: Math.max(0, toFiniteNumber(stats.conversationsCompleted, 0)),
            pronunciationErrors: Math.max(0, toFiniteNumber(stats.pronunciationErrors, 0)),
            recordedAudioBytes: Math.max(0, toFiniteNumber(stats.recordedAudioBytes, 0))
        }
    };
}

class State {
    constructor() {
        this.reset();
    }

    reset() {
        Object.assign(this, clone(createInitialState()));
        return this;
    }

    initialize(savedState = null) {
        const source = isPlainObject(savedState) ? savedState : {};
        const defaults = createInitialState();
        const sourceProfile = isPlainObject(source.profile) ? source.profile : {};
        const sourceProfessional = isPlainObject(sourceProfile.professional)
            ? sourceProfile.professional
            : {};

        const migratedTrack = normalizeString(
            sourceProfessional.track || sourceProfile.professionalTrack
        );
        const levelTag = normalizeCefr(sourceProfile.levelTag || sourceProfile.levelResult?.cefr, "A1");

        this.schemaVersion = STATE_SCHEMA_VERSION;
        this.user = {
            ...defaults.user,
            ...(isPlainObject(source.user) ? clone(source.user) : {})
        };

        this.profile = {
            ...defaults.profile,
            ...sourceProfile,
            name: normalizeString(sourceProfile.name),
            language: normalizeLanguageCode(sourceProfile.language),
            supportMode: normalizeString(sourceProfile.supportMode),
            goal: normalizeString(sourceProfile.goal),
            contact: normalizeString(sourceProfile.contact),
            lifeContext: normalizeString(sourceProfile.lifeContext),
            learningStyle: normalizeString(sourceProfile.learningStyle),
            dailyMinutes: Math.max(0, toFiniteNumber(sourceProfile.dailyMinutes, 0)),
            diagnosticScore: toFiniteNumber(sourceProfile.diagnosticScore, 0),
            onboardingComplete: Boolean(sourceProfile.onboardingComplete),
            xp: Math.max(0, toFiniteNumber(sourceProfile.xp, 0)),
            level: Math.max(1, toFiniteNumber(sourceProfile.level, 1)),
            levelTag,
            achievements: Array.isArray(sourceProfile.achievements)
                ? clone(sourceProfile.achievements)
                : [],
            diagnosticAnswers: Array.isArray(sourceProfile.diagnosticAnswers)
                ? [...sourceProfile.diagnosticAnswers]
                : [],
            goalDetails: {
                ...defaults.profile.goalDetails,
                ...(isPlainObject(sourceProfile.goalDetails) ? sourceProfile.goalDetails : {}),
                interests: Array.isArray(sourceProfile.goalDetails?.interests)
                    ? sourceProfile.goalDetails.interests.map(normalizeString).filter(Boolean)
                    : []
            },
            onboardingProgress: {
                ...defaults.profile.onboardingProgress,
                ...(isPlainObject(sourceProfile.onboardingProgress)
                    ? sourceProfile.onboardingProgress
                    : {}),
                step: Math.max(0, Math.floor(toFiniteNumber(sourceProfile.onboardingProgress?.step, 0))),
                paused: Boolean(sourceProfile.onboardingProgress?.paused)
            },
            diagnosticProgress: {
                ...defaults.profile.diagnosticProgress,
                ...(isPlainObject(sourceProfile.diagnosticProgress)
                    ? sourceProfile.diagnosticProgress
                    : {}),
                step: Math.max(0, Math.floor(toFiniteNumber(sourceProfile.diagnosticProgress?.step, 0))),
                answers: Array.isArray(sourceProfile.diagnosticProgress?.answers)
                    ? [...sourceProfile.diagnosticProgress.answers]
                    : [],
                scores: Array.isArray(sourceProfile.diagnosticProgress?.scores)
                    ? sourceProfile.diagnosticProgress.scores.map((value) => toFiniteNumber(value, 0))
                    : [],
                currentDifficulty: Math.min(
                    5,
                    Math.max(1, Math.floor(toFiniteNumber(sourceProfile.diagnosticProgress?.currentDifficulty, 3)))
                )
            },
            levelResult: normalizeLevelResult(sourceProfile.levelResult, levelTag),
            dailyPlan: {
                ...defaults.profile.dailyPlan,
                ...(isPlainObject(sourceProfile.dailyPlan) ? sourceProfile.dailyPlan : {})
            },
            professionalTrack: migratedTrack,
            professional: {
                ...defaults.profile.professional,
                ...sourceProfessional,
                track: migratedTrack || null,
                progress: isPlainObject(sourceProfessional.progress)
                    ? clone(sourceProfessional.progress)
                    : {},
                completedModules: Array.isArray(sourceProfessional.completedModules)
                    ? [...sourceProfessional.completedModules]
                    : [],
                unlockedModules: Array.isArray(sourceProfessional.unlockedModules)
                    ? [...sourceProfessional.unlockedModules]
                    : []
            },
            mentor: {
                ...defaults.profile.mentor,
                ...(isPlainObject(sourceProfile.mentor) ? sourceProfile.mentor : {}),
                notes: Array.isArray(sourceProfile.mentor?.notes)
                    ? [...sourceProfile.mentor.notes]
                    : []
            },
            learning: {
                ...defaults.profile.learning,
                ...(isPlainObject(sourceProfile.learning) ? sourceProfile.learning : {}),
                streak: Math.max(0, toFiniteNumber(sourceProfile.learning?.streak, 0)),
                totalStudyMinutes: Math.max(0, toFiniteNumber(sourceProfile.learning?.totalStudyMinutes, 0)),
                pendingReviews: Array.isArray(sourceProfile.learning?.pendingReviews)
                    ? clone(sourceProfile.learning.pendingReviews)
                    : [],
                weakTopics: Array.isArray(sourceProfile.learning?.weakTopics)
                    ? [...sourceProfile.learning.weakTopics]
                    : [],
                masteredTopics: Array.isArray(sourceProfile.learning?.masteredTopics)
                    ? [...sourceProfile.learning.masteredTopics]
                    : []
            }
        };

        const normalizedLanguages = (Array.isArray(source.languages) ? source.languages : [])
            .map(normalizeLanguageRecord)
            .filter(Boolean);
        this.languages = Array.from(
            new Map(normalizedLanguages.map((item) => [item.code, item])).values()
        );

        const requestedCurrent = normalizeLanguageCode(
            source.currentLanguage || sourceProfile.language
        );
        if (requestedCurrent && !this.languages.some((item) => item.code === requestedCurrent)) {
            this.languages.push(normalizeLanguageRecord({
                code: requestedCurrent,
                level: levelTag,
                diagnosticScore: this.profile.diagnosticScore,
                diagnosticAnswers: this.profile.diagnosticAnswers,
                levelResult: this.profile.levelResult,
                stats: {}
            }));
        }

        this.currentLanguage = requestedCurrent || this.languages[0]?.code || "";
        this.profile.language = this.currentLanguage;

        const currentRecord = this.getLanguage(this.currentLanguage);
        if (currentRecord) {
            const profileResult = normalizeLevelResult(this.profile.levelResult, this.profile.levelTag);
            if (
                !currentRecord.levelResult?.completedAt &&
                profileResult.completedAt &&
                currentRecord.level === profileResult.cefr
            ) {
                currentRecord.levelResult = profileResult;
                currentRecord.diagnosticScore = this.profile.diagnosticScore;
                currentRecord.diagnosticAnswers = [...this.profile.diagnosticAnswers];
            }

            this.profile.levelTag = currentRecord.level;
            this.profile.levelResult = normalizeLevelResult(currentRecord.levelResult, currentRecord.level);
            this.profile.diagnosticScore = toFiniteNumber(currentRecord.diagnosticScore, 0);
            this.profile.diagnosticAnswers = [...currentRecord.diagnosticAnswers];
        }

        const sourceSettings = isPlainObject(source.settings) ? source.settings : {};
        const theme = normalizeString(sourceSettings.theme).toLowerCase();
        this.settings = {
            ...defaults.settings,
            ...sourceSettings,
            theme: THEMES.has(theme) ? theme : defaults.settings.theme
        };

        return this;
    }

    set(key, value) {
        if (!TOP_LEVEL_KEYS.has(key)) {
            console.warn(`Propriedade desconhecida no estado: ${key}`);
            return false;
        }

        if (key === "profile") {
            this.initialize({ ...this.toJSON(), profile: value });
        } else if (key === "languages") {
            const records = Array.isArray(value) ? value.map(normalizeLanguageRecord).filter(Boolean) : [];
            this.languages = Array.from(new Map(records.map((item) => [item.code, item])).values());
            if (this.currentLanguage && !this.getLanguage(this.currentLanguage)) {
                this.setCurrentLanguage(this.languages[0]?.code || "");
            }
        } else if (key === "currentLanguage") {
            return this.setCurrentLanguage(value);
        } else if (key === "settings") {
            this.updateSettings(value);
        } else if (key === "user") {
            this.user = isPlainObject(value) ? clone(value) : {};
        } else if (key === "schemaVersion") {
            this.schemaVersion = STATE_SCHEMA_VERSION;
        }
        return true;
    }

    get(key) {
        return TOP_LEVEL_KEYS.has(key) ? this[key] : undefined;
    }

    updateProfile(patch = {}) {
        if (!isPlainObject(patch)) return this.profile;
        this.profile = {
            ...this.profile,
            ...patch,
            goalDetails: patch.goalDetails
                ? {
                    ...this.profile.goalDetails,
                    ...patch.goalDetails,
                    interests: Array.isArray(patch.goalDetails.interests)
                        ? patch.goalDetails.interests.map(normalizeString).filter(Boolean)
                        : this.profile.goalDetails.interests
                }
                : this.profile.goalDetails,
            onboardingProgress: patch.onboardingProgress
                ? { ...this.profile.onboardingProgress, ...patch.onboardingProgress }
                : this.profile.onboardingProgress,
            diagnosticProgress: patch.diagnosticProgress
                ? {
                    ...this.profile.diagnosticProgress,
                    ...patch.diagnosticProgress,
                    answers: Array.isArray(patch.diagnosticProgress.answers)
                        ? [...patch.diagnosticProgress.answers]
                        : this.profile.diagnosticProgress.answers,
                    scores: Array.isArray(patch.diagnosticProgress.scores)
                        ? [...patch.diagnosticProgress.scores]
                        : this.profile.diagnosticProgress.scores
                }
                : this.profile.diagnosticProgress,
            mentor: patch.mentor
                ? {
                    ...this.profile.mentor,
                    ...patch.mentor,
                    notes: Array.isArray(patch.mentor.notes)
                        ? [...patch.mentor.notes]
                        : this.profile.mentor.notes
                }
                : this.profile.mentor,
            learning: patch.learning
                ? {
                    ...this.profile.learning,
                    ...patch.learning,
                    pendingReviews: Array.isArray(patch.learning.pendingReviews)
                        ? clone(patch.learning.pendingReviews)
                        : this.profile.learning.pendingReviews,
                    weakTopics: Array.isArray(patch.learning.weakTopics)
                        ? [...patch.learning.weakTopics]
                        : this.profile.learning.weakTopics,
                    masteredTopics: Array.isArray(patch.learning.masteredTopics)
                        ? [...patch.learning.masteredTopics]
                        : this.profile.learning.masteredTopics
                }
                : this.profile.learning,
            dailyPlan: patch.dailyPlan
                ? { ...this.profile.dailyPlan, ...patch.dailyPlan }
                : this.profile.dailyPlan,
            levelResult: patch.levelResult
                ? normalizeLevelResult({ ...this.profile.levelResult, ...patch.levelResult }, patch.levelTag || this.profile.levelTag)
                : this.profile.levelResult,
            professional: patch.professional
                ? {
                    ...this.profile.professional,
                    ...patch.professional,
                    progress: isPlainObject(patch.professional.progress)
                        ? { ...this.profile.professional.progress, ...patch.professional.progress }
                        : this.profile.professional.progress,
                    completedModules: Array.isArray(patch.professional.completedModules)
                        ? [...patch.professional.completedModules]
                        : this.profile.professional.completedModules,
                    unlockedModules: Array.isArray(patch.professional.unlockedModules)
                        ? [...patch.professional.unlockedModules]
                        : this.profile.professional.unlockedModules
                }
                : this.profile.professional,
            achievements: Array.isArray(patch.achievements)
                ? clone(patch.achievements)
                : this.profile.achievements,
            diagnosticAnswers: Array.isArray(patch.diagnosticAnswers)
                ? [...patch.diagnosticAnswers]
                : this.profile.diagnosticAnswers,
            levelTag: patch.levelTag !== undefined
                ? normalizeCefr(patch.levelTag, this.profile.levelTag)
                : this.profile.levelTag
        };
        return this.profile;
    }

    updateSettings(patch = {}) {
        if (!isPlainObject(patch)) return this.settings;
        const next = { ...this.settings, ...patch };
        const theme = normalizeString(next.theme).toLowerCase();
        next.theme = THEMES.has(theme) ? theme : this.settings.theme || "light";
        this.settings = next;
        return this.settings;
    }

    updateDailyPlan(plan = {}) {
        return this.updateProfile({ dailyPlan: plan }).dailyPlan;
    }

    updateMentor(patch = {}) {
        return this.updateProfile({ mentor: patch }).mentor;
    }

    updateLearning(patch = {}) {
        return this.updateProfile({ learning: patch }).learning;
    }

    updateLevelResult(patch = {}) {
        return this.updateProfile({ levelResult: patch }).levelResult;
    }

    isOnboardingCompleted() {
        return Boolean(this.profile.onboardingComplete);
    }

    setCurrentLanguage(language) {
        const code = normalizeLanguageCode(language);
        if (!code) {
            this.currentLanguage = "";
            this.profile.language = "";
            return false;
        }
        this.currentLanguage = code;
        this.profile.language = code;
        return true;
    }

    addLanguage(language) {
        const normalized = normalizeLanguageRecord(language);
        if (!normalized) return null;
        const index = this.languages.findIndex((item) => item.code === normalized.code);
        if (index >= 0) {
            const existing = this.languages[index];
            const hasOwn = (key) => Object.prototype.hasOwnProperty.call(language, key);
            this.languages[index] = {
                ...existing,
                ...normalized,
                name: hasOwn("name") || hasOwn("label") ? normalized.name : existing.name,
                flag: hasOwn("flag") ? normalized.flag : existing.flag,
                mentor: hasOwn("mentor") ? normalized.mentor : existing.mentor,
                level: hasOwn("level") ? normalized.level : existing.level,
                xp: hasOwn("xp") ? normalized.xp : existing.xp,
                progress: hasOwn("progress") ? normalized.progress : existing.progress,
                diagnosticScore: hasOwn("diagnosticScore")
                    ? normalized.diagnosticScore
                    : existing.diagnosticScore,
                diagnosticAnswers: hasOwn("diagnosticAnswers")
                    ? [...normalized.diagnosticAnswers]
                    : existing.diagnosticAnswers,
                levelResult: hasOwn("levelResult")
                    ? normalizeLevelResult(normalized.levelResult, normalized.level)
                    : existing.levelResult,
                stats: isPlainObject(language.stats)
                    ? { ...existing.stats, ...normalized.stats }
                    : existing.stats
            };
            return this.languages[index];
        }
        this.languages.push(normalized);
        return normalized;
    }

    getLanguage(code = this.currentLanguage) {
        const normalized = normalizeLanguageCode(code);
        return this.languages.find((item) => item.code === normalized) || null;
    }

    toJSON() {
        return clone({
            schemaVersion: this.schemaVersion,
            user: this.user,
            profile: this.profile,
            languages: this.languages,
            currentLanguage: this.currentLanguage,
            settings: this.settings
        });
    }
}

export const state = new State();
export { STATE_SCHEMA_VERSION, CEFR_LEVELS };
