import { state } from "./state.js";

const STORAGE_KEY = "estudo_flex_v3";

function getLocalStorage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function emitStateUpdated() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent("state-updated", { detail: state.toJSON() })
    );
}

export const storage = {
    load() {
        const store = getLocalStorage();
        if (!store) {
            state.reset();
            return false;
        }

        try {
            const saved = store.getItem(STORAGE_KEY);
            if (!saved) {
                state.reset();
                return true;
            }
            state.initialize(JSON.parse(saved));
            return true;
        } catch (error) {
            console.error("Erro ao carregar estado:", error);
            try {
                store.removeItem(STORAGE_KEY);
            } catch {
                // O navegador pode bloquear inclusive a remoção.
            }
            state.reset();
            return false;
        }
    },

    save() {
        const store = getLocalStorage();
        if (!store) {
            emitStateUpdated();
            return false;
        }

        try {
            store.setItem(STORAGE_KEY, JSON.stringify(state.toJSON()));
            emitStateUpdated();
            return true;
        } catch (error) {
            console.error("Erro ao salvar estado:", error);
            emitStateUpdated();
            return false;
        }
    },

    clear() {
        const store = getLocalStorage();
        try {
            store?.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn("Não foi possível limpar o armazenamento:", error);
        }
        state.reset();
        emitStateUpdated();
    },

    isFirstRun() {
        return !state.isOnboardingCompleted();
    },

    finishOnboarding() {
        state.updateProfile({
            onboardingComplete: true,
            onboardingProgress: {
                step: 0,
                paused: false,
                updatedAt: new Date().toISOString()
            }
        });
        return this.save();
    }
};
