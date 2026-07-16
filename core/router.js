import { state } from "./state.js";

const ONBOARDING_PAGES = new Set([
    "welcome",
    "onboarding",
    "goals",
    "level-test",
    "finish"
]);

const APP_PAGES = new Set([
    "home",
    "languages",
    "language-setup",
    "language-diagnostic",
    "review",
    "profile",
    "passport",
    "mentor",
    "speaking",
    "professional",
    "professional-study"
]);

class Router {
    constructor() {
        this.current = "welcome";
        this.initialized = false;
        this.pages = [...ONBOARDING_PAGES, ...APP_PAGES];
        this.lastHandledLocation = "";
        this.handleHistoryChange = this.handleHistoryChange.bind(this);
    }

    initialize(initialPage = null) {
        if (!this.initialized) {
            window.addEventListener("popstate", this.handleHistoryChange);
            window.addEventListener("hashchange", this.handleHistoryChange);
            this.initialized = true;
        }

        const requested = initialPage || this.getHashPage() || this.getDefaultPage();
        this.navigate(requested, "replace");
    }

    handleHistoryChange() {
        const locationKey = `${location.pathname}${location.search}${location.hash}`;
        if (locationKey === this.lastHandledLocation) return;
        this.lastHandledLocation = locationKey;
        this.navigate(this.getHashPage() || this.getDefaultPage(), "none");
    }

    getHashPage() {
        const rawHash = location.hash.replace(/^#/, "");
        try {
            return decodeURIComponent(rawHash).trim();
        } catch {
            return rawHash.trim();
        }
    }

    getDefaultPage() {
        return state.isOnboardingCompleted() ? "home" : this.getResumePage();
    }

    getResumePage() {
        const profile = state.profile || {};
        if (!profile.name) return "welcome";

        const onboardingFields = [
            "language",
            "supportMode",
            "goal",
            "contact",
            "dailyMinutes",
            "lifeContext",
            "learningStyle"
        ];
        if (onboardingFields.some((field) => !profile[field])) return "onboarding";

        const goals = profile.goalDetails || {};
        if (!profile.goalDescription || !profile.useCase || !goals.deadline || !goals.frequency || !Array.isArray(goals.interests) || goals.interests.length === 0) {
            return "goals";
        }

        if (!profile.levelResult?.completedAt) return "level-test";
        return "finish";
    }

    resolvePage(page) {
        let resolved = this.pages.includes(page) ? page : this.getDefaultPage();
        const completed = state.isOnboardingCompleted();

        if (completed && ONBOARDING_PAGES.has(resolved)) {
            resolved = "home";
        } else if (!completed && APP_PAGES.has(resolved)) {
            resolved = this.getResumePage();
        }

        return resolved;
    }

    navigate(page, historyMode = "push") {
        // Compatibilidade com chamadas antigas navigate(page, false).
        if (historyMode === false) historyMode = "none";
        if (historyMode === true) historyMode = "push";

        const resolvedPage = this.resolvePage(page);
        const currentPage = document.querySelector(`[data-page="${resolvedPage}"]`);
        if (!currentPage) {
            console.error(`A seção da rota #${resolvedPage} não existe no documento.`);
            return false;
        }

        this.current = resolvedPage;
        document.querySelectorAll("[data-page]").forEach((section) => {
            section.hidden = section !== currentPage;
        });

        document.querySelectorAll("[data-route]").forEach((control) => {
            const active = control.dataset.route === resolvedPage;
            control.classList.toggle("active", active);
            if (active) control.setAttribute("aria-current", "page");
            else control.removeAttribute("aria-current");
        });

        const onboarding = ONBOARDING_PAGES.has(resolvedPage);
        const header = document.querySelector("ef-header");
        const navbar = document.querySelector("ef-navbar");
        if (header) header.hidden = onboarding;
        if (navbar) navbar.hidden = onboarding;

        const targetHash = `#${encodeURIComponent(resolvedPage)}`;
        if (historyMode === "push" && location.hash !== targetHash) {
            history.pushState({ page: resolvedPage }, "", targetHash);
        } else if (historyMode === "replace" || location.hash !== targetHash) {
            history.replaceState({ page: resolvedPage }, "", targetHash);
        }
        this.lastHandledLocation = `${location.pathname}${location.search}${location.hash}`;

        window.dispatchEvent(
            new CustomEvent("routechange", { detail: { page: resolvedPage } })
        );

        const pageComponent = currentPage.firstElementChild;
        if (typeof pageComponent?.onRouteEnter === "function") {
            pageComponent.onRouteEnter();
        }

        requestAnimationFrame(() => {
            const focusTarget = currentPage.querySelector(
                '[autofocus], h1, h2, input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusTarget) return;
            if (/^H[12]$/.test(focusTarget.tagName) && !focusTarget.hasAttribute("tabindex")) {
                focusTarget.setAttribute("tabindex", "-1");
            }
            focusTarget.focus?.({ preventScroll: true });
        });

        return true;
    }

    getCurrentPage() {
        return this.current;
    }

    isOnboarding() {
        return ONBOARDING_PAGES.has(this.current);
    }
}

export const router = new Router();
export { ONBOARDING_PAGES, APP_PAGES };
