import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { clearProfessionalTrack, getProfessionalProgress, getProfessionalTracks, getUserTrack } from "../../services/professional.js";
import { isLanguageReady } from "../../services/language-profile.service.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

export class EFProfessionalPage extends HTMLElement {
    constructor() { super(); this.refresh = this.render.bind(this); }
    connectedCallback() { window.addEventListener("state-updated", this.refresh); window.addEventListener("professional-track-changed", this.refresh); }
    disconnectedCallback() { window.removeEventListener("state-updated", this.refresh); window.removeEventListener("professional-track-changed", this.refresh); }
    onRouteEnter() {
        const record = state.getLanguage(state.currentLanguage);
        if (!record) return router.navigate("languages", "replace");
        if (!isLanguageReady(record)) return router.navigate("language-setup", "replace");
        this.record = record;
        this.render();
    }

    render() {
        if (!this.record) return;
        const language = EF_LANGUAGES[this.record.code] || this.record;
        const selected = getUserTrack(this.record.code);
        const progress = getProfessionalProgress(this.record.code);
        this.innerHTML = `
            <section class="professional-container">
                <header class="professional-context-header">
                    <div class="professional-area-heading"><span class="professional-area-icon" aria-hidden="true">${escapeHTML(selected?.icon || "💼")}</span><div><span class="professional-eyebrow">Professional Lab · ${escapeHTML(language.name)}</span><h1>${escapeHTML(selected?.title || "Escolha uma trilha profissional")}</h1><p>${selected ? `Seu progresso nesta trilha é ${progress}%. A escolha e o progresso pertencem apenas a ${escapeHTML(language.name)}.` : "Escolher a profissão não concede XP. O XP começa quando você conclui uma atividade real."}</p></div></div>
                </header>
                ${selected ? `
                    <article class="professional-scenario-card">
                        <span class="professional-eyebrow">TRILHA ATIVA</span><h2>${escapeHTML(selected.title)}</h2><p class="professional-scenario-context">${escapeHTML(selected.description)}</p>
                        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div>
                        <div class="professional-selected-actions"><button id="startProfessionalTrack" type="button" class="professional-btn">Começar ou continuar</button><button id="clearProfessionalTrack" type="button" class="secondary">Escolher outra trilha</button></div>
                    </article>
                ` : ""}
                <section class="professional-board-section"><div class="professional-section-heading"><div><span class="professional-eyebrow">ÁREAS DISPONÍVEIS</span><h2>Trilhas para ${escapeHTML(language.name)}</h2></div><span class="professional-board-count">${getProfessionalTracks().length} áreas</span></div><ef-professional-list></ef-professional-list></section>
            </section>
        `;
        this.querySelector("#startProfessionalTrack")?.addEventListener("click", () => router.navigate("professional-study"));
        this.querySelector("#clearProfessionalTrack")?.addEventListener("click", () => clearProfessionalTrack(this.record.code));
    }
}

if (!customElements.get("ef-professional-page")) customElements.define("ef-professional-page", EFProfessionalPage);
