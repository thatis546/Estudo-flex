import { state } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

export class EFLanguageCard extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("language-changed", this.refresh);
        window.addEventListener("state-updated", this.refresh);
    }

    disconnectedCallback() {
        window.removeEventListener("language-changed", this.refresh);
        window.removeEventListener("state-updated", this.refresh);
    }

    getLanguageData() {
        const code = String(state.currentLanguage || "").toLowerCase();
        const configuration = EF_LANGUAGES[code];
        if (!code || !configuration) return null;
        const progress = state.getLanguage(code) || {};
        return {
            code,
            name: configuration.name || progress.name || "Idioma",
            flag: configuration.flag || progress.flag || "🌍",
            mentor: configuration.mentor || progress.mentor || "Mentor",
            country: configuration.country || "Cultura internacional",
            level: progress.level || "A1",
            xp: Number(progress.xp) || 0,
            progress: Math.min(100, Math.max(0, Number(progress.progress) || 0)),
            lessonsCompleted: Number(progress.stats?.lessonsCompleted) || 0
        };
    }

    render() {
        const language = this.getLanguageData();
        if (!language) {
            this.innerHTML = `
                <article class="language-card language-card--empty">
                    <span class="language-card-empty-icon" aria-hidden="true">🌍</span>
                    <div><h2>Escolha um idioma</h2><p>Selecione um idioma para visualizar seu progresso e seu mentor.</p></div>
                </article>
            `;
            return;
        }

        this.innerHTML = `
            <article class="language-card" data-language="${escapeHTML(language.code)}">
                <header class="language-card-header">
                    <span class="language-card-flag" aria-hidden="true">${escapeHTML(language.flag)}</span>
                    <div class="language-card-heading">
                        <span class="language-card-status">Explorando</span>
                        <h2 class="language-card-title">${escapeHTML(language.name)}</h2>
                        <p class="language-card-country">${escapeHTML(language.country)}</p>
                    </div>
                    <span class="language-card-level">${escapeHTML(language.level)}</span>
                </header>
                <div class="language-card-mentor">
                    <span class="language-card-mentor-icon" aria-hidden="true">💬</span>
                    <div><small>Seu mentor</small><strong>${escapeHTML(language.mentor)}</strong></div>
                </div>
                <div class="language-card-progress">
                    <div class="language-card-progress-header"><span>Progresso no idioma</span><strong>${language.progress}%</strong></div>
                    <div class="language-card-progress-track" role="progressbar" aria-label="Progresso em ${escapeHTML(language.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${language.progress}">
                        <span class="language-card-progress-bar" style="width:${language.progress}%"></span>
                    </div>
                </div>
                <footer class="language-card-stats">
                    <div class="language-card-stat"><small>XP</small><strong>${language.xp}</strong></div>
                    <div class="language-card-stat"><small>Lições</small><strong>${language.lessonsCompleted}</strong></div>
                    <div class="language-card-stat"><small>Nível</small><strong>${escapeHTML(language.level)}</strong></div>
                </footer>
            </article>
        `;
    }
}

if (!customElements.get("ef-language-card")) customElements.define("ef-language-card", EFLanguageCard);
