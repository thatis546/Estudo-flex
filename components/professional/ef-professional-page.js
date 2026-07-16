import { state } from "../../core/state.js";
import { clearProfessionalTrack, getProfessionalTracks, getUserTrack } from "../../services/professional.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

export class EFProfessionalPage extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("state-updated", this.refresh);
        window.addEventListener("professional-track-changed", this.refresh);
    }

    disconnectedCallback() {
        window.removeEventListener("state-updated", this.refresh);
        window.removeEventListener("professional-track-changed", this.refresh);
    }

    render() {
        const userName = state.profile?.name || "Profissional";
        const selected = getUserTrack();
        const trackCount = getProfessionalTracks().length;
        const subareas = Array.isArray(selected?.subareas) ? selected.subareas : [];

        this.innerHTML = `
            <section class="professional-container">
                <header class="professional-context-header">
                    <div class="professional-area-heading">
                        <span class="professional-area-icon" aria-hidden="true">${escapeHTML(selected?.icon || "💼")}</span>
                        <div>
                            <span class="professional-eyebrow">Professional Lab</span>
                            <h1>Olá, ${escapeHTML(userName)}!</h1>
                            <p>${selected
                                ? `Sua trilha atual é ${escapeHTML(selected.title)}. Você pode trocá-la a qualquer momento.`
                                : "Escolha uma trilha para praticar o idioma em situações profissionais."}</p>
                        </div>
                    </div>
                </header>

                ${selected ? `
                    <article class="professional-scenario-card" aria-labelledby="selectedTrackTitle">
                        <span class="professional-eyebrow">Trilha selecionada</span>
                        <h2 id="selectedTrackTitle">${escapeHTML(selected.title)}</h2>
                        <p class="professional-scenario-context">${escapeHTML(selected.description)}</p>
                        <div class="professional-task-box">
                            <strong>Subáreas previstas</strong>
                            <p>${subareas.length
                                ? subareas.map((item) => escapeHTML(item.title)).join(" • ")
                                : "Os módulos desta trilha serão adicionados nas próximas sprints."}</p>
                        </div>
                        <button id="clearProfessionalTrack" type="button" class="professional-btn">Trocar trilha</button>
                    </article>
                ` : ""}

                <section class="professional-board-section">
                    <div class="professional-section-heading">
                        <div><span class="professional-eyebrow">Trilhas</span><h2>Áreas profissionais</h2></div>
                        <span class="professional-board-count">${trackCount} áreas</span>
                    </div>
                    <ef-professional-list></ef-professional-list>
                </section>
            </section>
        `;

        this.querySelector("#clearProfessionalTrack")?.addEventListener("click", clearProfessionalTrack);
    }
}

if (!customElements.get("ef-professional-page")) customElements.define("ef-professional-page", EFProfessionalPage);
