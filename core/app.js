import { router } from "./router.js";
import { state } from "./state.js";
import { storage } from "./storage.js";

class EstudoFlexApp {
    constructor() {
        this.systemThemeQuery = null;
        this.handleStateUpdate = this.handleStateUpdate.bind(this);
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    }

    async start() {
        storage.load();
        this.initializeTheme();
        await import("../components/register.js");
        this.initializeSkipLink();

        window.dispatchEvent(
            new CustomEvent("state-loaded", { detail: state.toJSON() })
        );

        router.initialize();
        this.registerServiceWorker();
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

        navigator.serviceWorker.register("./sw.js").catch((error) => {
            console.warn("Não foi possível registrar o Service Worker:", error);
        });
    }
}

export const app = new EstudoFlexApp();

const startApp = () => app.start().catch((error) => {
    console.error("Falha ao iniciar o Estudo Flex Languages:", error);
    const toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = "Não foi possível iniciar o aplicativo. Recarregue a página.";
        toast.classList.add("show");
    }
});

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
    startApp();
}
