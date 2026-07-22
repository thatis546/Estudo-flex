const APP_VERSION = "0.9.0";
const VERSION_STORAGE_KEY = "estudo_flex_frontend_version";
const CACHE_PREFIX = "estudoflex-";

const CRITICAL_DEPLOYMENT_FILES = Object.freeze([
    "./core/app.js",
    "./core/router.js",
    "./core/state.js",
    "./core/storage.js",
    "./core/profile-options.js",
    "./data/onboarding.js",
    "./data/diagnostic-bank.js",
    "./services/achievement-service.js",
    "./services/review.service.js",
    "./services/speech-recognition.service.js",
    "./services/mentor-chat.service.js",
    "./components/onboarding/ef-welcome.js",
    "./components/onboarding/ef-onboarding.js",
    "./components/onboarding/ef-goals.js",
    "./components/onboarding/ef-finish.js",
    "./components/home/ef-home-page.js",
    "./components/review/ef-review-page.js",
    "./components/mentor/ef-mentor-page.js",
    "./components/speaking/ef-speaking-page.js",
    "./components/professional/ef-professional-study-page.js",
    "./components/profile/ef-profile-page.js",
    "./components/passport/ef-passport-page.js",
    "./css/main.css",
    "./css/v090.css"
]);

async function clearLegacyCaches() {
    if (!("caches" in globalThis)) return;

    try {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((key) => key.startsWith(CACHE_PREFIX))
                .map((key) => caches.delete(key))
        );
    } catch (error) {
        console.warn("Não foi possível limpar caches antigos:", error);
    }
}

function readStoredVersion() {
    try {
        return globalThis.localStorage?.getItem(VERSION_STORAGE_KEY) || "";
    } catch {
        return "";
    }
}

function storeVersion() {
    try {
        globalThis.localStorage?.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    } catch {
        // O aplicativo continua funcional mesmo com armazenamento bloqueado.
    }
}

async function prepareCurrentVersion() {
    const previousVersion = readStoredVersion();
    if (previousVersion === APP_VERSION) return;

    await clearLegacyCaches();
    storeVersion();
}

async function checkDeploymentFiles() {
    const checks = await Promise.all(
        CRITICAL_DEPLOYMENT_FILES.map(async (path) => {
            try {
                const url = new URL(path, document.baseURI);
                url.searchParams.set("v", APP_VERSION);
                const response = await fetch(url.href, {
                    method: "GET",
                    cache: "no-store",
                    headers: { "Cache-Control": "no-cache" }
                });
                return { path, ok: response.ok, status: response.status };
            } catch (error) {
                return { path, ok: false, status: 0, error };
            }
        })
    );

    return checks.filter((item) => !item.ok);
}

async function resetRuntimeAndReload() {
    try {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        await clearLegacyCaches();
        try {
            globalThis.localStorage?.removeItem(VERSION_STORAGE_KEY);
        } catch {
            // Sem ação adicional.
        }
    } finally {
        const url = new URL(location.href);
        url.searchParams.set("update", APP_VERSION);
        location.replace(url.href);
    }
}

function showStartupFailure(error) {
    console.error("Falha ao iniciar o Estudo Flex Languages:", error);

    const main = document.getElementById("mainContent") || document.body;
    const message = error?.userMessage ||
        "Alguns arquivos da atualização não foram carregados corretamente.";
    const technicalDetail = error?.message ? String(error.message) : "Erro de inicialização desconhecido.";
    const missingFiles = Array.isArray(error?.missingFiles) ? error.missingFiles : [];

    main.innerHTML = `
        <section class="startup-error" role="alert" aria-labelledby="startupErrorTitle">
            <div class="startup-error-card">
                <p class="eyebrow">Falha de atualização</p>
                <h1 id="startupErrorTitle">Não foi possível iniciar o aplicativo</h1>
                <p>${message}</p>
                <p class="startup-error-detail"></p>
                <ul class="startup-error-files" aria-label="Arquivos ausentes"></ul>
                <div class="startup-error-actions">
                    <button type="button" class="primary" data-action="repair-startup">
                        Limpar atualização antiga e recarregar
                    </button>
                    <a class="secondary-button" href="./diagnostico-publicacao.html">
                        Abrir diagnóstico da publicação
                    </a>
                </div>
            </div>
        </section>
    `;

    const detail = main.querySelector(".startup-error-detail");
    if (detail) detail.textContent = technicalDetail;

    const list = main.querySelector(".startup-error-files");
    if (list && missingFiles.length) {
        missingFiles.forEach((path) => {
            const item = document.createElement("li");
            item.textContent = path;
            list.append(item);
        });
    } else {
        list?.remove();
    }

    main.querySelector('[data-action="repair-startup"]')?.addEventListener(
        "click",
        () => resetRuntimeAndReload(),
        { once: true }
    );
}

async function start() {
    try {
        await prepareCurrentVersion();

        const missing = await checkDeploymentFiles();
        if (missing.length) {
            const error = new Error(
                `Publicação incompleta: ${missing.map((item) => `${item.path} (${item.status || "sem resposta"})`).join(", ")}`
            );
            error.userMessage = "A versão publicada no GitHub não contém todos os arquivos obrigatórios.";
            error.missingFiles = missing.map((item) => item.path);
            throw error;
        }

        const moduleUrl = new URL(`./app.js?v=${APP_VERSION}`, import.meta.url);
        const { app } = await import(moduleUrl.href);
        await app.start();
    } catch (error) {
        showStartupFailure(error);
    }
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", start, { once: true });
} else {
    start();
}

export {
    APP_VERSION,
    CRITICAL_DEPLOYMENT_FILES,
    checkDeploymentFiles,
    clearLegacyCaches,
    prepareCurrentVersion,
    resetRuntimeAndReload
};
