import { router } from "./router.js";
import { state } from "./state.js";
import { storage } from "./storage.js";
import { synchronizeAchievementRewards } from "../services/achievement-service.js";
import { config } from "./config.js";

const ROUTE_COMPONENTS = Object.freeze({
    welcome: "ef-welcome",
    onboarding: "ef-onboarding",
    goals: "ef-goals",
    "level-test": "ef-level-test",
    finish: "ef-finish",
    home: "ef-home-page",
    languages: "ef-languages-page",
    "language-setup": "ef-language-setup",
    "language-diagnostic": "ef-language-diagnostic",
    review: "ef-review-page",
    lesson: "ef-lesson-page",
    profile: "ef-profile-page",
    passport: "ef-passport-page",
    mentor: "ef-mentor-page",
    speaking: "ef-speaking-page",
    professional: "ef-professional-page",
    "professional-study": "ef-professional-study-page"
});

const COMPONENT_MODULES = Object.freeze([
    { path: "../components/layout/ef-header.js", tag: "ef-header", area: "layout" },
    { path: "../components/layout/ef-navbar.js", tag: "ef-navbar", area: "layout" },

    { path: "../components/onboarding/ef-welcome.js", tag: "ef-welcome", area: "onboarding" },
    { path: "../components/onboarding/ef-onboarding.js", tag: "ef-onboarding", area: "onboarding" },
    { path: "../components/onboarding/ef-goals.js", tag: "ef-goals", area: "onboarding" },
    { path: "../components/onboarding/ef-level-test.js", tag: "ef-level-test", area: "onboarding" },
    { path: "../components/onboarding/ef-finish.js", tag: "ef-finish", area: "onboarding" },

    { path: "../components/home/ef-home-page.js", tag: "ef-home-page", area: "home" },

    { path: "../components/languages/ef-languages-page.js", tag: "ef-languages-page", area: "languages" },
    { path: "../components/languages/ef-language-selector.js", tag: "ef-language-selector", area: "languages" },
    { path: "../components/languages/ef-language-card.js", tag: "ef-language-card", area: "languages" },
    { path: "../components/languages/ef-language-setup.js", tag: "ef-language-setup", area: "languages" },
    { path: "../components/languages/ef-language-diagnostic.js", tag: "ef-language-diagnostic", area: "languages" },

    { path: "../components/review/ef-review-page.js", tag: "ef-review-page", area: "review" },
    { path: "../components/lesson/ef-lesson-page.js", tag: "ef-lesson-page", area: "lesson" },

    { path: "../components/profile/ef-profile-page.js", tag: "ef-profile-page", area: "profile" },
    { path: "../components/profile/ef-profile-card.js", tag: "ef-profile-card", area: "profile" },
    { path: "../components/profile/ef-learning-style.js", tag: "ef-learning-style", area: "profile" },
    { path: "../components/profile/ef-avatar-editor.js", tag: "ef-avatar-editor", area: "profile" },
    { path: "../components/profile/ef-privacy-controls.js", tag: "ef-privacy-controls", area: "profile" },

    { path: "../components/passport/ef-passport-page.js", tag: "ef-passport-page", area: "passport" },
    { path: "../components/passport/ef-passport-card.js", tag: "ef-passport-card", area: "passport" },
    { path: "../components/passport/ef-stamps.js", tag: "ef-stamps", area: "passport" },
    { path: "../components/passport/ef-achievement-card.js", tag: "ef-achievement-card", area: "passport" },
    { path: "../components/passport/ef-achievements.js", tag: "ef-achievements", area: "passport" },

    { path: "../components/mentor/ef-mentor-page.js", tag: "ef-mentor-page", area: "mentor" },
    { path: "../components/speaking/ef-speaking-page.js", tag: "ef-speaking-page", area: "speaking" },

    { path: "../components/professional/ef-professional-page.js", tag: "ef-professional-page", area: "professional" },
    { path: "../components/professional/ef-professional-list.js", tag: "ef-professional-list", area: "professional" },
    { path: "../components/professional/ef-professional-study-page.js", tag: "ef-professional-study-page", area: "professional" }
]);

function componentModuleUrl(path) {
    const url = new URL(path, import.meta.url);
    url.searchParams.set("v", config.version);
    return url.href;
}

async function registerComponents() {
    const results = await Promise.all(
        COMPONENT_MODULES.map(async (descriptor) => {
            try {
                await import(componentModuleUrl(descriptor.path));
                return { ...descriptor, loaded: true, error: null };
            } catch (error) {
                console.error(`Falha ao carregar ${descriptor.path}:`, error);
                return { ...descriptor, loaded: false, error };
            }
        })
    );

    return {
        loaded: results.filter((result) => result.loaded),
        failures: results.filter((result) => !result.loaded)
    };
}

class EstudoFlexApp {
    constructor() {
        this.systemThemeQuery = null;
        this.handleStateUpdate = this.handleStateUpdate.bind(this);
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    }

    async start() {
        storage.load();
        this.initializeTheme();

        const registration = await registerComponents();

        this.synchronizeLegacyDataSafely();
        this.initializeSkipLink();

        window.dispatchEvent(
            new CustomEvent("state-loaded", { detail: state.toJSON() })
        );

        const initialPage = this.resolveAvailableInitialPage(registration.failures);
        router.initialize(initialPage);
        this.reportComponentFailures(registration.failures);
        this.registerServiceWorker();

        console.info(`Estudo Flex Languages ${config.version} iniciado.`);
    }

    synchronizeLegacyDataSafely() {
        try {
            synchronizeAchievementRewards();
        } catch (error) {
            console.error("A migração de conquistas falhou e foi isolada:", error);
            state.profile.achievements = Array.isArray(state.profile.achievements)
                ? state.profile.achievements.filter((item) => item && typeof item === "object")
                : [];
            state.profile.xpLedger = Array.isArray(state.profile.xpLedger)
                ? state.profile.xpLedger.filter((item) => item && typeof item === "object")
                : [];
            state.profile.activityXP = state.profile.xpLedger.reduce(
                (sum, entry) => sum + Math.max(0, Number(entry?.amount) || 0),
                0
            );
            state.profile.xp = state.profile.activityXP;
            storage.save();
        }
    }

    resolveAvailableInitialPage(failures) {
        const requested = router.getHashPage() || router.getDefaultPage();
        const requestedTag = ROUTE_COMPONENTS[requested];
        if (!requestedTag || customElements.get(requestedTag)) return requested;

        const failure = failures.find((item) => item.tag === requestedTag);
        console.error("A rota inicial não pôde ser carregada:", failure || requestedTag);

        if (customElements.get("ef-welcome")) return "welcome";

        const error = new Error(
            `O componente obrigatório ${requestedTag} não foi carregado. Verifique se todos os arquivos da versão ${config.version} foram enviados ao GitHub.`
        );
        error.userMessage = "A publicação no GitHub ficou incompleta ou misturou arquivos de versões diferentes.";
        throw error;
    }

    reportComponentFailures(failures) {
        if (!failures.length) return;

        const missing = failures.map((item) => item.path).join(", ");
        console.error("Arquivos de componentes que falharam:", missing);

        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = "A atualização abriu, mas alguns módulos não foram carregados. Consulte diagnostico-publicacao.html.";
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 10000);
    }

    initializeSkipLink() {
        const skipLink = document.querySelector(".skip-link");
        const mainContent = document.getElementById("mainContent");
        if (!skipLink || !mainContent || skipLink.dataset.bound === "true") return;

        skipLink.dataset.bound = "true";
        skipLink.addEventListener("click", (event) => {
            event.preventDefault();
            mainContent.focus({ preventScroll: true });
            mainContent.scrollIntoView({ block: "start" });
        });
    }

    initializeTheme() {
        this.systemThemeQuery = globalThis.matchMedia?.("(prefers-color-scheme: dark)") || null;
        window.addEventListener("state-updated", this.handleStateUpdate);
        if (this.systemThemeQuery?.addEventListener) {
            this.systemThemeQuery.addEventListener("change", this.handleSystemThemeChange);
        } else {
            this.systemThemeQuery?.addListener?.(this.handleSystemThemeChange);
        }
        this.applyTheme();
    }

    handleStateUpdate() {
        this.applyTheme();
    }

    handleSystemThemeChange() {
        if (state.settings?.theme === "system") this.applyTheme();
    }

    applyTheme() {
        const preference = state.settings?.theme || "light";
        const resolvedTheme = preference === "system"
            ? (this.systemThemeQuery?.matches ? "dark" : "light")
            : preference;

        document.documentElement.dataset.theme = resolvedTheme;
        document.documentElement.style.colorScheme = resolvedTheme;
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            "content",
            resolvedTheme === "dark" ? "#17192B" : "#5B5CEB"
        );
    }

    registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;
        const isSecure = location.protocol === "https:" ||
            ["localhost", "127.0.0.1"].includes(location.hostname);
        if (!isSecure) return;

        navigator.serviceWorker.register(`./sw.js?v=${config.version}`, { updateViaCache: "none" })
            .then((registration) => registration.update())
            .catch((error) => {
                console.warn("Não foi possível registrar o Service Worker:", error);
            });
    }
}

export const app = new EstudoFlexApp();
export { COMPONENT_MODULES, registerComponents };
