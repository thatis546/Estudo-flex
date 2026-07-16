import { state } from "./state.js";
import { storage } from "./storage.js";

function createId() {
    return globalThis.crypto?.randomUUID?.() || `user-${Date.now()}`;
}

export const auth = {
    login(name) {
        const normalizedName = String(name ?? "").trim();
        if (!normalizedName) throw new TypeError("Nome obrigatório.");
        state.user = {
            ...state.user,
            id: state.user?.id || createId(),
            name: normalizedName,
            authenticatedAt: new Date().toISOString()
        };
        storage.save();
        return { ...state.user };
    },

    logout() {
        state.user = {};
        storage.save();
    },

    isAuthenticated() {
        return Boolean(state.user?.id);
    }
};
