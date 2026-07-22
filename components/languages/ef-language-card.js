import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { getCurrentLanguageRecord, getLanguageLevelLabel, isLanguageReady } from "../../services/language-profile.service.js";
import { getProfileOptionLabel, getPurposeSummary } from "../../core/profile-options.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));


export class EFLanguageCard extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        ["language-changed", "state-updated", "language-setup-completed"].forEach((event) => window.addEventListener(event, this.refresh));
    }

    disconnectedCallback() {
        ["language-changed", "state-updated", "language-setup-completed"].forEach((event) => window.removeEventListener(event, this.refresh));
    }

    render() {
        const code = String(state.currentLanguage || "").toLowerCase();
        const configuration = EF_LANGUAGES[code];
        const record = getCurrentLanguageRecord();
        if (!code || !configuration || !record) {
            this.innerHTML = `<article class="language-card language-card--empty"><span class="language-card-empty-icon" aria-hidden="true">🌍</span><div><h2>Escolha um idioma</h2><p>Cada língua terá objetivos, diagnóstico, progresso e trilhas próprios.</p></div></article>`;
            return;
        }

        const ready = isLanguageReady(record);
        const journey = getLanguageLevelLabel(record);
        const profile = record.learningProfile || {};
        const progress = Math.min(100, Math.max(0, Number(record.progress) || 0));
        const interests = profile.goalDetails?.interests || [];
        const purpose = getPurposeSummary(profile.goal);
        const purposeLabel = getProfileOptionLabel(code, "goal", profile.goal) || "A descobrir";
        const purposeDescription = profile.goalDescription || purpose?.goalDescription || "Objetivo em construção";
        const useCase = profile.useCase || purpose?.useCase || "Situação de uso em construção";

        this.innerHTML = `
            <article class="language-card" data-language="${escapeHTML(code)}">
                <header class="language-card-header">
                    <span class="language-card-flag" aria-hidden="true">${escapeHTML(configuration.flag || record.flag || "🌍")}</span>
                    <div class="language-card-heading">
                        <span class="language-card-status">${ready ? "Perfil independente ativo" : "Configuração necessária"}</span>
                        <h2 class="language-card-title">${escapeHTML(configuration.name)}</h2>
                        <p class="language-card-country">${escapeHTML(configuration.country || "Cultura internacional")}</p>
                    </div>
                    <span class="language-card-level ${ready ? "" : "is-pending"}">${escapeHTML(journey)}</span>
                </header>

                ${ready ? `
                    <div class="language-card-context-grid">
                        <div class="language-card-context"><small>Finalidade</small><strong>${escapeHTML(purposeLabel)}</strong><span>${escapeHTML(purposeDescription)}</span></div>
                        <div class="language-card-context"><small>Situação concreta</small><strong>${escapeHTML(getProfileOptionLabel(code, "lifeContext", profile.lifeContext) || "A descobrir")}</strong><span>${escapeHTML(useCase)}</span></div>
                    </div>
                    <div class="language-card-context"><small>Interesses desta língua</small><strong>${escapeHTML(interests.length ? interests.join(" • ") : "Nenhum interesse selecionado")}</strong></div>
                    <div class="language-card-progress">
                        <div class="language-card-progress-header"><span>Progresso no idioma</span><strong>${progress}%</strong></div>
                        <div class="language-card-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span class="language-card-progress-bar" style="width:${progress}%"></span></div>
                    </div>
                    <footer class="language-card-stats">
                        <div class="language-card-stat"><small>XP da língua</small><strong>${Number(record.xp) || 0}</strong></div>
                        <div class="language-card-stat"><small>Revisões</small><strong>${Number(record.stats?.reviewsCompleted) || 0}</strong></div>
                        <div class="language-card-stat"><small>Jornada</small><strong>${escapeHTML(record.journeyLabel)}</strong></div>
                    </footer>
                    <div class="actions language-card-actions">
                        <button id="editCurrentLanguage" type="button" class="secondary">Editar objetivo</button>
                        <button id="redoCurrentDiagnostic" type="button" class="secondary">Refazer diagnóstico</button>
                        <button id="openCurrentReview" type="button" class="primary">Revisão rápida</button>
                    </div>
                ` : `
                    <div class="language-card-setup-message">
                        <p>O aplicativo não presumirá jornada, finalidade ou progresso. Configure esta língua e responda ao diagnóstico completo.</p>
                        <button id="configureCurrentLanguage" type="button" class="primary full">Configurar ${escapeHTML(configuration.name)}</button>
                    </div>
                `}
            </article>
        `;

        this.querySelector("#configureCurrentLanguage")?.addEventListener("click", () => router.navigate("language-setup"));
        this.querySelector("#editCurrentLanguage")?.addEventListener("click", () => router.navigate("language-setup"));
        this.querySelector("#redoCurrentDiagnostic")?.addEventListener("click", () => router.navigate("language-diagnostic"));
        this.querySelector("#openCurrentReview")?.addEventListener("click", () => router.navigate("review"));
    }
}

if (!customElements.get("ef-language-card")) customElements.define("ef-language-card", EFLanguageCard);
