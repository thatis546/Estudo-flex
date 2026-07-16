import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { getCurrentLanguageRecord } from "./language-profile.service.js";

class MentorService {
    initialize() { return state.profile; }
    getProfile() { return state.profile; }
    get(key) { return state.profile?.[key]; }

    set(key, value) {
        if (!key) return false;
        state.updateProfile({ [key]: value });
        return storage.save();
    }

    upsert(_profile, key, value) { return this.set(key, value); }

    getSummary() {
        const profile = state.profile;
        const language = getCurrentLanguageRecord();
        return {
            name: profile.name,
            languageCode: language?.code || "",
            languageName: language?.name || "",
            journeyId: language?.journeyId || "",
            journeyLabel: language?.journeyLabel || "",
            goal: language?.learningProfile?.goal || "",
            goalDescription: language?.learningProfile?.goalDescription || "",
            useCase: language?.learningProfile?.useCase || "",
            interests: language?.learningProfile?.goalDetails?.interests || [],
            learningStyle: language?.learningProfile?.learningStyle || profile.learningStyle,
            supportMode: profile.supportMode,
            professionalTrack: language?.professional?.selectedTrack || "",
            memories: profile.aiMemory?.enabled ? profile.aiMemory.items : []
        };
    }

    clearPreferences() {
        state.updateMentor({
            personality: "guided",
            mood: "friendly",
            speed: "normal",
            correctionStyle: "final",
            humor: 0.8,
            sarcasm: 0.1
        });
        return storage.save();
    }

    clear() { return this.clearPreferences(); }
}

export const mentor = new MentorService();
