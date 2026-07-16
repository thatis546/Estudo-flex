import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { EF_LANGUAGES } from "../data/languages.js";
import { registerAchievementEvent } from "./achievement-service.js";

export function registerUser(formData = {}) {
    try {
        const languageCode = String(formData.language || "en").trim().toLowerCase();
        const language = EF_LANGUAGES[languageCode];
        if (!language) throw new Error("Idioma inválido.");

        state.updateProfile({
            name: String(formData.name || "").trim(),
            supportMode: formData.supportMode || "guided",
            goal: formData.goal || "",
            dailyMinutes: Math.max(0, Number(formData.dailyMinutes) || 0),
            lifeContext: formData.lifeContext || "",
            learningStyle: formData.learningStyle || "",
            goalDetails: formData.goalDetails || {},
            onboardingComplete: true
        });
        state.setCurrentLanguage(languageCode);
        state.addLanguage({
            code: languageCode,
            name: language.name,
            flag: language.flag,
            mentor: language.mentor,
            level: "",
            setupComplete: false,
            setupStatus: "diagnostic-required",
            learningProfile: {
                goal: state.profile.goal,
                contact: state.profile.contact || "",
                dailyMinutes: state.profile.dailyMinutes,
                lifeContext: state.profile.lifeContext,
                learningStyle: state.profile.learningStyle,
                goalDetails: state.profile.goalDetails
            },
            stats: {}
        });
        storage.save();
        registerAchievementEvent("onboarding-completed");
        return true;
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        return false;
    }
}

export function isUserRegistered() {
    return state.isOnboardingCompleted();
}
