import { state } from "../../core/state.js";
import { getProfileOptionLabel } from "../../core/profile-options.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character])
);

class EFProfileCard extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("state-updated", this.refresh);
        window.addEventListener("language-changed", this.refresh);
    }

    disconnectedCallback() {
        window.removeEventListener("state-updated", this.refresh);
        window.removeEventListener("language-changed", this.refresh);
    }

    render() {
        const profile = state.profile || {};
        const interests = Array.isArray(profile.goalDetails?.interests)
            ? profile.goalDetails.interests
            : [];
        const contextLabel = getProfileOptionLabel(
            profile.language || state.currentLanguage,
            "lifeContext",
            profile.lifeContext
        );
        const context = contextLabel || interests.join(" • ") || "Contexto de vida ainda não informado";

        this.innerHTML = `
            <article class="profile-header-card">
                <div class="profile-avatar" aria-hidden="true">
                    ${escapeHTML((profile.name || "E").charAt(0).toUpperCase())}
                </div>
                <div>
                    <p class="eyebrow">Perfil Vivo</p>
                    <h2>${escapeHTML(profile.name || "Estudante")}</h2>
                    <p>${escapeHTML(context)}</p>
                    <span class="profile-level-badge">
                        ${escapeHTML(profile.levelTag || "A1")} · ${Number(profile.xp) || 0} XP
                    </span>
                </div>
            </article>
        `;
    }
}

if (!customElements.get("ef-profile-card")) {
    customElements.define("ef-profile-card", EFProfileCard);
}
