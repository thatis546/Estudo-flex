import { state } from "../core/state.js";
import { storage } from "../core/storage.js";

import {
    ACHIEVEMENT_CATALOG,
    getAchievementById
} from "../data/achievement-catalog.js";


/* ==========================================================================
   Resolução do idioma atual
   ========================================================================== */

/**
 * Transforma state.languages em uma lista, independentemente de ele ser
 * um array ou um objeto indexado por código.
 */
function getLanguagesList() {
    if (Array.isArray(state.languages)) {
        return state.languages;
    }

    if (
        state.languages &&
        typeof state.languages === "object"
    ) {
        return Object.values(state.languages);
    }

    return [];
}


/**
 * Normaliza um idioma recebido como objeto ou código.
 */
function normalizeLanguage(languageValue) {
    if (
        languageValue &&
        typeof languageValue === "object"
    ) {
        return {
            code:
                languageValue.code ||
                languageValue.id ||
                "",

            name:
                languageValue.name ||
                languageValue.label ||
                languageValue.code ||
                "Idioma",

            flag:
                languageValue.flag ||
                "🌍"
        };
    }

    if (typeof languageValue === "string") {
        const languages = getLanguagesList();

        const normalizedValue =
            languageValue.trim().toLowerCase();

        const match = languages.find((language) => {
            const code = String(
                language.code ||
                language.id ||
                ""
            ).toLowerCase();

            const name = String(
                language.name ||
                language.label ||
                ""
            ).toLowerCase();

            return (
                code === normalizedValue ||
                name === normalizedValue
            );
        });

        if (match) {
            return normalizeLanguage(match);
        }

        return {
            code: normalizedValue,
            name: languageValue,
            flag: "🌍"
        };
    }

    return {
        code: "",
        name: "Idioma",
        flag: "🌍"
    };
}


/**
 * Retorna o idioma selecionado atualmente.
 */
function resolveCurrentLanguage() {
    return normalizeLanguage(state.currentLanguage);
}


/* ==========================================================================
   Inicialização e persistência
   ========================================================================== */

function ensureAchievementState() {
    if (!state.profile || typeof state.profile !== "object") {
        state.profile = {};
    }

    if (!Array.isArray(state.profile.achievements)) {
        state.profile.achievements = [];
    }

    const currentXP = Number(state.profile.xp);

    state.profile.xp = Number.isFinite(currentXP)
        ? currentXP
        : 0;
}


function saveState() {
    if (typeof storage.save !== "function") {
        console.warn(
            "storage.save() não está disponível."
        );

        return false;
    }

    try {
        return storage.save();
    } catch (error) {
        console.error(
            "Não foi possível salvar a conquista:",
            error
        );

        return false;
    }
}


/* ==========================================================================
   Identificação e duplicidade
   ========================================================================== */

/**
 * Conquistas globais:
 * habit-30-days
 *
 * Conquistas por idioma:
 * vocab-100:it
 * vocab-100:fr
 */
function createAchievementKey(
    achievement,
    language
) {
    if (achievement.scope === "language") {
        return `${achievement.id}:${language.code}`;
    }

    return achievement.id;
}


function hasAchievement(
    achievement,
    achievementKey,
    language
) {
    return state.profile.achievements.some(
        (record) => {
            if (record.key === achievementKey) {
                return true;
            }

            /*
             * Compatibilidade com conquistas antigas que foram
             * salvas antes da criação da propriedade "key".
             */
            if (record.id !== achievement.id) {
                return false;
            }

            if (achievement.scope !== "language") {
                return true;
            }

            return (
                record.language?.code ===
                language.code
            );
        }
    );
}


/* ==========================================================================
   Desbloqueio principal
   ========================================================================== */

/**
 * Desbloqueia uma conquista específica.
 *
 * @param {string} achievementId
 * @param {object} options
 * @param {object|string} options.language
 * @param {string} options.unlockedAt
 * @param {object} options.metadata
 *
 * @returns {object|null}
 */
export function unlockAchievement(
    achievementId,
    options = {}
) {
    const achievement =
        getAchievementById(achievementId);

    if (!achievement) {
        console.warn(
            `Conquista não encontrada: ${achievementId}`
        );

        return null;
    }

    ensureAchievementState();

    const scope =
        achievement.scope ||
        "global";

    const language =
        normalizeLanguage(
            options.language ??
            state.currentLanguage
        );

    /*
     * Uma conquista por idioma não pode ser registrada sem
     * sabermos em qual idioma ela foi obtida.
     */
    if (
        scope === "language" &&
        !language.code
    ) {
        console.warn(
            `Não foi possível desbloquear "${achievementId}": ` +
            "nenhum idioma válido está selecionado."
        );

        return null;
    }

    const achievementKey =
        createAchievementKey(
            achievement,
            language
        );

    if (
        hasAchievement(
            achievement,
            achievementKey,
            language
        )
    ) {
        return null;
    }

    const xp = Number(achievement.xp);

    const unlockedAt =
        options.unlockedAt ||
        new Date().toISOString();

    const record = {
        key: achievementKey,
        id: achievement.id,

        type:
            achievement.type ||
            "learning",

        category:
            achievement.category ||
            "Conquista",

        icon:
            achievement.icon ||
            "✨",

        title:
            achievement.title ||
            "Nova conquista",

        description:
            achievement.description ||
            "Uma nova etapa foi registrada.",

        image:
            achievement.image ||
            "",

        imageAlt:
            achievement.imageAlt ||
            achievement.title ||
            "Ilustração da conquista",

        scope,

        /*
         * Conquistas globais não ficam vinculadas a um idioma.
         * Conquistas com scope "language" preservam o idioma
         * utilizado no momento do desbloqueio.
         */
        language:
            scope === "language"
                ? {
                    code: language.code,
                    name: language.name,
                    flag: language.flag
                }
                : null,

        xp:
            Number.isFinite(xp)
                ? xp
                : 0,

        unlockedAt,
        unlocked: true,

        metadata:
            options.metadata &&
            typeof options.metadata === "object"
                ? { ...options.metadata }
                : {}
    };

    state.profile.achievements.push(record);
    state.profile.xp += record.xp;

    saveState();
    notifyAchievement(record);

    return record;
}


/* ==========================================================================
   Verificação por métricas numéricas
   ========================================================================== */

/**
 * Exemplos:
 *
 * checkMetricAchievements("streakDays", 30);
 * checkMetricAchievements("knownWords", 100);
 * checkMetricAchievements("conversationMinutes", 15);
 */
export function checkMetricAchievements(
    metric,
    currentValue,
    options = {}
) {
    const numericValue = Number(currentValue);

    if (!Number.isFinite(numericValue)) {
        console.warn(
            `Valor inválido para a métrica "${metric}":`,
            currentValue
        );

        return [];
    }

    const unlocked = [];

    Object.values(ACHIEVEMENT_CATALOG)
        .filter((achievement) => {
            const requirement =
                achievement.requirement;

            const target =
                Number(requirement?.target);

            return (
                requirement?.metric === metric &&
                Number.isFinite(target) &&
                numericValue >= target
            );
        })
        .forEach((achievement) => {
            const result = unlockAchievement(
                achievement.id,
                options
            );

            if (result) {
                unlocked.push(result);
            }
        });

    return unlocked;
}


/* ==========================================================================
   Verificação por valores exatos
   ========================================================================== */

/**
 * Necessário para conquistas como:
 *
 * requirement: {
 *     metric: "cefrLevel",
 *     value: "B1"
 * }
 *
 * Uso:
 * checkValueAchievements("cefrLevel", "B1");
 */
export function checkValueAchievements(
    metric,
    currentValue,
    options = {}
) {
    const normalizeValue = (value) =>
        String(value ?? "")
            .trim()
            .toLocaleLowerCase("pt-BR");

    const normalizedCurrentValue =
        normalizeValue(currentValue);

    if (!normalizedCurrentValue) {
        return [];
    }

    const unlocked = [];

    Object.values(ACHIEVEMENT_CATALOG)
        .filter((achievement) => {
            const requirement =
                achievement.requirement;

            return (
                requirement?.metric === metric &&
                requirement?.value !== undefined &&
                normalizeValue(
                    requirement.value
                ) === normalizedCurrentValue
            );
        })
        .forEach((achievement) => {
            const result = unlockAchievement(
                achievement.id,
                options
            );

            if (result) {
                unlocked.push(result);
            }
        });

    return unlocked;
}


/* ==========================================================================
   Registro de eventos específicos
   ========================================================================== */

/**
 * Exemplos:
 *
 * registerAchievementEvent("podcast-completed");
 * registerAchievementEvent("asked-directions");
 * registerAchievementEvent("short-story-completed");
 */
export function registerAchievementEvent(
    eventName,
    options = {}
) {
    const normalizedEvent =
        String(eventName ?? "").trim();

    if (!normalizedEvent) {
        return [];
    }

    const unlocked = [];

    Object.values(ACHIEVEMENT_CATALOG)
        .filter(
            (achievement) =>
                achievement.requirement?.event ===
                normalizedEvent
        )
        .forEach((achievement) => {
            const result = unlockAchievement(
                achievement.id,
                options
            );

            if (result) {
                unlocked.push(result);
            }
        });

    return unlocked;
}


/* ==========================================================================
   Consulta de conquistas
   ========================================================================== */

export function isAchievementUnlocked(
    achievementId,
    languageValue = null
) {
    ensureAchievementState();

    const achievement =
        getAchievementById(achievementId);

    if (!achievement) {
        return false;
    }

    const language =
        languageValue !== null
            ? normalizeLanguage(languageValue)
            : resolveCurrentLanguage();

    const key =
        createAchievementKey(
            achievement,
            language
        );

    return hasAchievement(
        achievement,
        key,
        language
    );
}


export function getUnlockedAchievements() {
    ensureAchievementState();

    return [...state.profile.achievements];
}


/* ==========================================================================
   Comunicação com a interface
   ========================================================================== */

function notifyAchievement(achievement) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent(
            "achievement-unlocked",
            {
                detail: achievement
            }
        )
    );
}
