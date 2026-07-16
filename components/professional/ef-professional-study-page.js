import { state } from "../../core/state.js";
import { storage } from "../../core/storage.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { getProfessionalVocabulary } from "../../data/professional-vocabulary.js";
import { completeProfessionalModule, getCurrentModules, getCurrentTrackState, getProfessionalModule, getProfessionalProgress, getUserTrack, saveProfessionalResponse, startProfessionalModule } from "../../services/professional.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

export class EFProfessionalStudyPage extends HTMLElement {
    connectedCallback() {}

    onRouteEnter() {
        this.record = state.getLanguage(state.currentLanguage);
        this.track = getUserTrack(state.currentLanguage);
        if (!this.record || !this.track) return router.navigate("professional", "replace");
        this.language = EF_LANGUAGES[this.record.code] || this.record;
        const modules = getCurrentModules(this.record.code);
        const trackState = getCurrentTrackState(this.record.code);
        const activeId = trackState?.activeModule || modules[0]?.id || "";
        this.activeModule = getProfessionalModule(activeId, this.record.code) || modules[0] || null;
        if (this.activeModule) startProfessionalModule(this.activeModule.id, this.record.code);
        this.render();
    }

    activateModule(moduleId) {
        const module = startProfessionalModule(moduleId, this.record.code);
        if (!module) return;
        this.activeModule = module;
        this.render();
    }

    render() {
        const modules = getCurrentModules(this.record.code);
        const trackState = getCurrentTrackState(this.record.code);
        const progress = getProfessionalProgress(this.record.code);
        const activeProgress = trackState?.progress?.[this.activeModule?.id] || {};
        const savedResponse = trackState?.responses?.[this.activeModule?.id]?.text || "";
        const vocabulary = getProfessionalVocabulary(this.record.code);

        this.innerHTML = `
            <section class="professional-study-container" aria-labelledby="professionalStudyTitle">
                <header class="screen-header">
                    <button id="backToProfessional" type="button" class="back-button" aria-label="Voltar">←</button>
                    <div><p class="eyebrow">PROFESSIONAL LAB · ${escapeHTML(this.language.name)}</p><h1 id="professionalStudyTitle">${escapeHTML(this.track.title)}</h1><p>${escapeHTML(this.track.description)}</p></div>
                </header>
                <article class="professional-study-progress card"><div><small>Progresso da trilha</small><strong>${progress}%</strong></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div></article>
                <div class="professional-study-layout">
                    <aside class="professional-module-list" aria-label="Módulos da trilha">
                        ${modules.map((module, index) => {
                            const itemProgress = trackState?.progress?.[module.id];
                            const active = module.id === this.activeModule?.id;
                            return `<button type="button" class="professional-module-button ${active ? "is-active" : ""}" data-module-id="${escapeHTML(module.id)}" aria-pressed="${active}"><span>${index + 1}</span><span><strong>${escapeHTML(module.title)}</strong><small>${itemProgress?.status === "completed" ? "Concluído" : itemProgress ? "Em andamento" : "Não iniciado"}</small></span></button>`;
                        }).join("")}
                    </aside>
                    <article class="professional-lesson-card card">
                        <p class="eyebrow">MÓDULO ATUAL</p><h2>${escapeHTML(this.activeModule?.title || "Selecione um módulo")}</h2>
                        <p>Use o vocabulário abaixo para produzir uma resposta ligada a uma situação real desta subárea.</p>
                        <div class="professional-vocabulary-list">${vocabulary.map(([term, translation]) => `<div class="professional-vocabulary-item"><strong>${escapeHTML(term)}</strong><span>${escapeHTML(translation)}</span></div>`).join("")}</div>
                        <div class="professional-task-box"><strong>Desafio prático</strong><p>Em ${escapeHTML(this.language.name)}, apresente sua relação com “${escapeHTML(this.activeModule?.title || this.track.title)}”, descreva um problema possível e proponha um próximo passo.</p></div>
                        <label><span class="slider-label">Sua resposta</span><textarea id="professionalResponse" class="text-input" rows="8" maxlength="2200" placeholder="Escreva no idioma estudado...">${escapeHTML(savedResponse)}</textarea></label>
                        <p id="professionalStatus" class="form-help" role="status">${activeProgress.status === "completed" ? "Este módulo já foi concluído; você pode editar e salvar uma nova versão." : "A seleção da trilha não dá XP. Concluir este desafio dá XP uma única vez."}</p>
                        <div class="actions">
                            <button id="saveProfessionalDraft" type="button" class="secondary">Salvar rascunho</button>
                            <button id="practiceProfessionalSpeaking" type="button" class="secondary">Praticar no Communication Lab</button>
                            <button id="completeProfessionalModule" type="button" class="primary">${activeProgress.status === "completed" ? "Atualizar resposta" : "Concluir módulo"}</button>
                        </div>
                    </article>
                </div>
            </section>
        `;

        this.querySelector("#backToProfessional")?.addEventListener("click", () => router.navigate("professional"));
        this.querySelectorAll("[data-module-id]").forEach((button) => button.addEventListener("click", () => this.activateModule(button.dataset.moduleId)));
        this.querySelector("#saveProfessionalDraft")?.addEventListener("click", () => this.saveDraft());
        this.querySelector("#practiceProfessionalSpeaking")?.addEventListener("click", () => {
            this.record.communicationLab.selectedModule = "professional";
            storage.save();
            router.navigate("speaking");
        });
        this.querySelector("#completeProfessionalModule")?.addEventListener("click", () => this.complete());
    }

    saveDraft() {
        const response = this.querySelector("#professionalResponse")?.value || "";
        saveProfessionalResponse(this.activeModule.id, response, this.record.code);
        this.setStatus("Rascunho salvo para esta língua e trilha.");
    }

    complete() {
        const response = this.querySelector("#professionalResponse")?.value || "";
        try {
            completeProfessionalModule(this.activeModule.id, { response, languageCode: this.record.code });
            this.setStatus("Módulo concluído e progresso salvo.");
            this.render();
        } catch (error) {
            this.setStatus(error.message || "Não foi possível concluir o módulo.", true);
        }
    }

    setStatus(message, error = false) {
        const status = this.querySelector("#professionalStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("form-error", error);
    }
}

if (!customElements.get("ef-professional-study-page")) customElements.define("ef-professional-study-page", EFProfessionalStudyPage);
