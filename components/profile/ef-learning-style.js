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

const LABELS = {
    immediate: "Correção imediata",
    final: "Correção ao final",
    silent: "Sem interrupções",
    pt: "Explicações em português",
    guided: "Imersão guiada",
    immersive: "Imersão ampliada"
};

class EFLearningStyle extends HTMLElement {
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
        const learningStyle = getProfileOptionLabel(
            profile.language || state.currentLanguage,
            "learningStyle",
            profile.learningStyle
        ) || "Estilo ainda em análise";

        this.innerHTML = `
            <article class="card">
                <h3>Preferências de aprendizagem</h3>
                <p>${escapeHTML(learningStyle)}</p>
                <p>
                    ${escapeHTML(LABELS[profile.supportMode] || "Suporte adaptativo")} ·
                    ${escapeHTML(LABELS[profile.mentor?.correctionStyle] || "Correção configurável")}
                </p>
            </article>
        `;
    }
}

if (!customElements.get("ef-learning-style")) {
    customElements.define("ef-learning-style", EFLearningStyle);
}
