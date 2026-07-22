const COMPONENT_VERSION = "0.9.0";

export const COMPONENT_MODULES = Object.freeze([
    { path: "./layout/ef-header.js", tag: "ef-header", area: "layout" },
    { path: "./layout/ef-navbar.js", tag: "ef-navbar", area: "layout" },

    { path: "./onboarding/ef-welcome.js", tag: "ef-welcome", area: "onboarding" },
    { path: "./onboarding/ef-onboarding.js", tag: "ef-onboarding", area: "onboarding" },
    { path: "./onboarding/ef-goals.js", tag: "ef-goals", area: "onboarding" },
    { path: "./onboarding/ef-level-test.js", tag: "ef-level-test", area: "onboarding" },
    { path: "./onboarding/ef-finish.js", tag: "ef-finish", area: "onboarding" },

    { path: "./home/ef-home-page.js", tag: "ef-home-page", area: "home" },

    { path: "./languages/ef-languages-page.js", tag: "ef-languages-page", area: "languages" },
    { path: "./languages/ef-language-selector.js", tag: "ef-language-selector", area: "languages" },
    { path: "./languages/ef-language-card.js", tag: "ef-language-card", area: "languages" },
    { path: "./languages/ef-language-setup.js", tag: "ef-language-setup", area: "languages" },
    { path: "./languages/ef-language-diagnostic.js", tag: "ef-language-diagnostic", area: "languages" },

    { path: "./review/ef-review-page.js", tag: "ef-review-page", area: "review" },

    { path: "./profile/ef-profile-page.js", tag: "ef-profile-page", area: "profile" },
    { path: "./profile/ef-profile-card.js", tag: "ef-profile-card", area: "profile" },
    { path: "./profile/ef-learning-style.js", tag: "ef-learning-style", area: "profile" },
    { path: "./profile/ef-avatar-editor.js", tag: "ef-avatar-editor", area: "profile" },
    { path: "./profile/ef-privacy-controls.js", tag: "ef-privacy-controls", area: "profile" },

    { path: "./passport/ef-passport-page.js", tag: "ef-passport-page", area: "passport" },
    { path: "./passport/ef-passport-card.js", tag: "ef-passport-card", area: "passport" },
    { path: "./passport/ef-stamps.js", tag: "ef-stamps", area: "passport" },
    { path: "./passport/ef-achievement-card.js", tag: "ef-achievement-card", area: "passport" },
    { path: "./passport/ef-achievements.js", tag: "ef-achievements", area: "passport" },

    { path: "./mentor/ef-mentor-page.js", tag: "ef-mentor-page", area: "mentor" },
    { path: "./speaking/ef-speaking-page.js", tag: "ef-speaking-page", area: "speaking" },

    { path: "./professional/ef-professional-page.js", tag: "ef-professional-page", area: "professional" },
    { path: "./professional/ef-professional-list.js", tag: "ef-professional-list", area: "professional" },
    { path: "./professional/ef-professional-study-page.js", tag: "ef-professional-study-page", area: "professional" }
]);

function moduleUrl(path) {
    const url = new URL(path, import.meta.url);
    url.searchParams.set("v", COMPONENT_VERSION);
    return url.href;
}

async function defaultImporter(path) {
    return import(moduleUrl(path));
}

export async function registerComponents(options = {}) {
    const importer = options.importer || defaultImporter;
    const results = await Promise.all(
        COMPONENT_MODULES.map(async (descriptor) => {
            try {
                await importer(descriptor.path, descriptor);
                return { ...descriptor, loaded: true, error: null };
            } catch (error) {
                console.error(`Falha ao carregar ${descriptor.path}:`, error);
                return { ...descriptor, loaded: false, error };
            }
        })
    );

    const failures = results.filter((result) => !result.loaded);
    return {
        loaded: results.filter((result) => result.loaded),
        failures
    };
}

export function missingRegisteredComponents() {
    return COMPONENT_MODULES.filter(({ tag }) => !customElements.get(tag));
}
