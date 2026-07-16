import { api } from "../core/api.js";
import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { validateAchievementConsistency } from "./achievement-service.js";

function clean(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function buildAchievementImagePrompt(achievement) {
    const language = achievement?.language || {};
    const avatar = achievement?.avatar || state.profile.avatar || {};
    const scene = clean(achievement?.metadata?.sceneType || achievement?.metadata?.scene || achievement?.title);
    const action = clean(achievement?.title);

    return [
        "Create one polished, warm, illustrated travel-journal scene for an educational achievement card.",
        `Main character: exactly one cute illustrated avatar in the ${clean(avatar.style, "Estudo Flex classic")} style.`,
        clean(avatar.description) ? `Avatar characteristics: ${clean(avatar.description)}.` : "Use the supplied avatar reference as the identity guide.",
        `Completed action: ${action}.`,
        scene ? `Scene and context: ${scene}.` : "Use a context that directly represents the completed action.",
        `Language context: ${clean(language.name)} (${clean(language.nativeName)}), associated country: ${clean(language.country)}.`,
        "The action, environment and cultural details must be mutually consistent.",
        "Do not include words, letters, captions, dates, numbers, flags, logos, badges, stamps, watermarks or interface elements.",
        "Do not include photographs or realistic identifiable people. Do not add extra characters unless the action requires an interlocutor in the background.",
        "Landscape 16:9 composition, central avatar, clear space around the subject so the frontend can overlay all text separately."
    ].filter(Boolean).join(" ");
}

function findAchievement(key) {
    return state.profile.achievements?.find((item) => item.key === key || item.id === key) || null;
}

export async function generateAchievementIllustration(achievementKey) {
    const achievement = findAchievement(achievementKey);
    if (!achievement) throw new Error("Conquista não encontrada.");

    const validation = validateAchievementConsistency(achievement);
    if (!validation.valid) {
        throw new Error(`Conquista inconsistente: ${validation.errors.join(" ")}`);
    }
    if (!achievement.avatar?.validated && state.profile.avatar?.validated === false) {
        throw new Error("O avatar precisa ser validado antes de gerar a ilustração.");
    }

    const response = await api("achievement/image", {
        method: "POST",
        body: {
            achievement: {
                key: achievement.key,
                title: achievement.title,
                description: achievement.description,
                language: achievement.language,
                sourceEvidence: achievement.sourceEvidence,
                sceneType: achievement.metadata?.sceneType || ""
            },
            avatar: achievement.avatar || state.profile.avatar,
            prompt: buildAchievementImagePrompt(achievement)
        },
        timeoutMs: 90000
    });

    const imageUrl = clean(response?.imageDataUrl || response?.imageUrl);
    if (!imageUrl) throw new Error("O serviço de imagem não devolveu uma ilustração.");

    const checks = response?.validation || {};
    if (checks.hasText === true || checks.hasConflictingFlag === true || checks.characterCount > 2) {
        throw new Error("A ilustração gerada não passou na validação de consistência.");
    }

    achievement.illustration = imageUrl;
    achievement.imageAlt = clean(
        response?.imageAlt,
        `Ilustração da conquista ${achievement.title} em ${achievement.language?.name || "um idioma"}`
    );
    achievement.metadata = {
        ...(achievement.metadata || {}),
        imageGeneratedAt: new Date().toISOString(),
        imageValidation: checks,
        imagePromptVersion: 1
    };
    storage.save();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("state-updated", { detail: state.toJSON() }));
    }
    return achievement;
}
