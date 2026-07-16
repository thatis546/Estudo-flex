import { state } from "../core/state.js";
import { storage } from "../core/storage.js";

class MentorService {
    initialize() {
        return state.profile;
    }

    getProfile() {
        return state.profile;
    }

    get(key) {
        return state.profile?.[key];
    }

    set(key, value) {
        if (!key) return false;
        state.updateProfile({ [key]: value });
        return storage.save();
    }

    // Mantém compatibilidade com chamadas antigas que passavam profile como primeiro argumento.
    upsert(_profile, key, value) {
        return this.set(key, value);
    }

    getSummary() {
        const profile = state.profile;
        return {
            name: profile.name,
            language: profile.language,
            level: profile.level,
            levelTag: profile.levelTag,
            goalDetails: profile.goalDetails,
            learningStyle: profile.learningStyle,
            supportMode: profile.supportMode,
            professionalTrack: profile.professional?.track || profile.professionalTrack
        };
    }

    clear() {
        state.updateMentor({
            personality: "guided",
            mood: "friendly",
            speed: "normal",
            correctionStyle: "immediate",
            humor: 0.8,
            sarcasm: 0.1,
            notes: []
        });
        return storage.save();
    }
}

export const mentor = new MentorService();
