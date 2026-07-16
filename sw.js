const CACHE_NAME = "estudoflex-v0.8.0";

const ESSENTIAL_ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./favicon.ico",
    "./core/app.js",
    "./core/router.js",
    "./core/state.js",
    "./core/storage.js",
    "./core/diagnostic.js",
    "./core/profile-options.js",
    "./components/register.js",
    "./css/main.css"
];

const OPTIONAL_ASSETS = [
    "./components/layout/ef-header.js",
    "./components/layout/ef-navbar.js",
    "./components/onboarding/ef-welcome.js",
    "./components/onboarding/ef-onboarding.js",
    "./components/onboarding/ef-goals.js",
    "./components/onboarding/ef-level-test.js",
    "./components/onboarding/ef-finish.js",
    "./components/home/ef-home-page.js",
    "./components/languages/ef-languages-page.js",
    "./components/languages/ef-language-selector.js",
    "./components/languages/ef-language-card.js",
    "./components/profile/ef-profile-page.js",
    "./components/profile/ef-profile-card.js",
    "./components/profile/ef-learning-style.js",
    "./components/profile/ef-avatar-editor.js",
    "./components/profile/ef-privacy-controls.js",
    "./components/passport/ef-passport-page.js",
    "./components/passport/ef-passport-card.js",
    "./components/passport/ef-stamps.js",
    "./components/passport/ef-achievement-card.js",
    "./components/passport/ef-achievements.js",
    "./components/mentor/ef-mentor-page.js",
    "./components/speaking/ef-speaking-page.js",
    "./components/professional/ef-professional-page.js",
    "./components/professional/ef-professional-list.js",
    "./components/professional/ef-professional-study-page.js",
    "./components/review/ef-review-page.js",
    "./components/languages/ef-language-setup.js",
    "./components/languages/ef-language-diagnostic.js",
    "./services/achievement-service.js",
    "./services/achievement-image.service.js",
    "./services/share.service.js",
    "./services/avatar.service.js",
    "./services/profile-privacy.service.js",
    "./services/communication-lab.service.js",
    "./services/mentor-chat.service.js",
    "./services/language-profile.service.js",
    "./services/review.service.js",
    "./services/audio-recorder.service.js",
    "./services/professional.js",
    "./data/achievement-catalog.js",
    "./data/languages.js",
    "./data/professional-catalog.js",
    "./css/variables.css",
    "./css/reset.css",
    "./css/theme.css",
    "./css/base.css",
    "./css/typography.css",
    "./css/layout.css",
    "./css/buttons.css",
    "./css/forms.css",
    "./css/cards.css",
    "./css/progress.css",
    "./css/chat.css",
    "./css/components.css",
    "./css/header.css",
    "./css/navbar.css",
    "./css/navigation.css",
    "./css/home.css",
    "./css/languages.css",
    "./css/profile.css",
    "./css/passport.css",
    "./css/speaking.css",
    "./css/professional.css",
    "./css/mentor.css",
    "./css/toast.css",
    "./css/animations.css",
    "./css/responsive.css",
    "./assets/avatars/default-user.svg",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "./assets/icons/icon-maskable-512.png",
    "./assets/logos/logo-mark.svg"
];

function isApiRequest(url) {
    return url.pathname.includes("/api/") || url.pathname.endsWith("/api");
}

async function cacheOptionalAssets(cache) {
    await Promise.allSettled(
        OPTIONAL_ASSETS.map((url) => cache.add(url))
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ESSENTIAL_ASSETS);
        await cacheOptionalAssets(cache);
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin || isApiRequest(url)) return;

    if (request.mode === "navigate") {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put("./index.html", response.clone());
                }
                return response;
            } catch {
                return (
                    await caches.match("./index.html") ||
                    await caches.match("./") ||
                    new Response("Aplicativo indisponível offline.", {
                        status: 503,
                        headers: { "Content-Type": "text/plain; charset=utf-8" }
                    })
                );
            }
        })());
        return;
    }

    event.respondWith((async () => {
        const cached = await caches.match(request);
        if (cached) {
            event.waitUntil((async () => {
                try {
                    const response = await fetch(request);
                    if (response.ok && response.type === "basic") {
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(request, response);
                    }
                } catch {
                    // O recurso em cache continua disponível.
                }
            })());
            return cached;
        }

        try {
            const response = await fetch(request);
            if (response.ok && response.type === "basic") {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response.clone());
            }
            return response;
        } catch {
            return Response.error();
        }
    })());
});
