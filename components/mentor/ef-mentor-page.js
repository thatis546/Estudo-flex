import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import {
    MENTOR_ACTIVITIES,
    clearMentorConversation,
    getMentorConversation,
    sendMentorImageActivity,
    sendMentorMessage
} from "../../services/mentor-chat.service.js";
import { isLanguageReady } from "../../services/language-profile.service.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

class EFMentorPage extends HTMLElement {
    constructor() {
        super();
        this.sending = false;
        this.abortController = null;
        this.selectedActivity = "";
        this.previewUrl = "";
    }

    connectedCallback() {}
    disconnectedCallback() {
        this.abortController?.abort();
        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    }

    onRouteEnter() {
        const record = state.getLanguage(state.currentLanguage);
        if (!record) return router.navigate("languages", "replace");
        if (!isLanguageReady(record)) return router.navigate("language-setup", "replace");
        this.record = record;
        this.language = EF_LANGUAGES[record.code] || record;
        this.render();
    }

    render() {
        const messages = getMentorConversation(this.record.code);
        this.innerHTML = `
            <section class="mentor-page" aria-labelledby="mentorPageTitle">
                <header class="screen-header mentor-page-header">
                    <div>
                        <p class="eyebrow">MEU MENTOR</p>
                        <h1 id="mentorPageTitle">Orientação e atividades em texto</h1>
                        <p>Converse, peça explicações e escolha atividades. A análise de voz fica separada no Communication Lab.</p>
                    </div>
                    <span class="communication-language-badge">${escapeHTML(this.language.flag || "🌍")} ${escapeHTML(this.language.name)} · ${escapeHTML(this.record.journeyLabel)}</span>
                </header>

                <section class="mentor-activity-section" aria-labelledby="mentorActivitiesTitle">
                    <div class="mentor-section-heading"><p class="eyebrow">O QUE PODEMOS FAZER</p><h2 id="mentorActivitiesTitle">Escolha uma atividade</h2></div>
                    <div class="mentor-activity-grid">
                        ${MENTOR_ACTIVITIES.map((activity) => `
                            <button type="button" class="mentor-activity-card ${this.selectedActivity === activity.id ? "is-selected" : ""}" data-activity-id="${activity.id}">
                                <span aria-hidden="true">${activity.icon}</span><strong>${escapeHTML(activity.title)}</strong>
                            </button>
                        `).join("")}
                    </div>
                </section>

                <article class="card mentor-context-card">
                    <div><small>Objetivo desta língua</small><strong>${escapeHTML(this.record.learningProfile?.goalDescription || this.record.learningProfile?.goal || "Não definido")}</strong></div>
                    <div><small>Situação de uso</small><strong>${escapeHTML(this.record.learningProfile?.useCase || "Não definida")}</strong></div>
                    <div><small>Memórias autorizadas</small><strong>${state.profile.aiMemory?.enabled ? state.profile.aiMemory.items.length : "desativadas"}</strong></div>
                </article>

                <section class="mentor-chat-shell">
                    <div id="mentorMessages" class="mentor-message-list" aria-live="polite">
                        ${messages.length ? messages.map((message) => this.messageMarkup(message)).join("") : `
                            <div class="mentor-empty-state"><img src="./assets/avatars/mentor-neutral.svg" alt=""><h2>Como posso ajudar hoje?</h2><p>Escolha uma atividade acima ou escreva sua dúvida.</p></div>
                        `}
                    </div>

                    <form id="mentorForm" class="mentor-composer">
                        <div id="mentorImagePanel" class="mentor-image-panel" ${this.selectedActivity === "image" ? "" : "hidden"}>
                            <label for="mentorImageInput"><strong>Imagem para descrever</strong><span>PNG, JPG ou WebP, até 10 MB.</span></label>
                            <input id="mentorImageInput" type="file" accept="image/png,image/jpeg,image/webp">
                            <img id="mentorImagePreview" class="mentor-image-preview" alt="Prévia da imagem selecionada" ${this.previewUrl ? `src="${escapeHTML(this.previewUrl)}"` : "hidden"}>
                        </div>
                        <label class="sr-only" for="mentorInput">Mensagem para o Mentor</label>
                        <textarea id="mentorInput" class="text-input" rows="3" maxlength="3000" placeholder="Digite sua dúvida ou complete a atividade escolhida..."></textarea>
                        <div class="mentor-composer-actions">
                            <button id="clearMentorChat" type="button" class="secondary">Limpar conversa</button>
                            <button id="sendMentorMessage" type="submit" class="primary">Enviar</button>
                        </div>
                    </form>
                    <p id="mentorStatus" class="form-help" role="status"></p>
                </section>
            </section>
        `;

        this.querySelectorAll("[data-activity-id]").forEach((button) => {
            button.addEventListener("click", () => this.selectActivity(button.dataset.activityId));
        });
        this.querySelector("#mentorImageInput")?.addEventListener("change", (event) => this.previewImage(event.target.files?.[0]));
        this.querySelector("#mentorForm")?.addEventListener("submit", (event) => {
            event.preventDefault();
            this.send();
        });
        this.querySelector("#clearMentorChat")?.addEventListener("click", () => {
            if (globalThis.confirm?.("Limpar apenas o histórico desta conversa? As memórias são gerenciadas no Perfil.")) {
                clearMentorConversation(this.record.code);
                this.render();
            }
        });
        this.scrollToEnd();
    }

    selectActivity(activityId) {
        this.selectedActivity = activityId;
        const activity = MENTOR_ACTIVITIES.find((item) => item.id === activityId);
        this.render();
        const input = this.querySelector("#mentorInput");
        if (input && activity?.id !== "image") {
            input.value = activity?.prompt || "";
            input.focus();
        }
    }

    previewImage(file) {
        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        this.previewUrl = file ? URL.createObjectURL(file) : "";
        const preview = this.querySelector("#mentorImagePreview");
        if (!preview) return;
        if (this.previewUrl) {
            preview.src = this.previewUrl;
            preview.hidden = false;
        } else preview.hidden = true;
    }

    messageMarkup(message) {
        return `<article class="mentor-message mentor-message--${message.role === "user" ? "user" : "assistant"}"><small>${message.role === "user" ? "Você" : "Mentor"}${message.offline ? " · modo local" : ""}</small><p>${escapeHTML(message.text)}</p></article>`;
    }

    async send() {
        if (this.sending) return;
        const input = this.querySelector("#mentorInput");
        const message = String(input?.value || "").trim();
        const imageInput = this.querySelector("#mentorImageInput");
        const imageFile = imageInput?.files?.[0];
        if (this.selectedActivity === "image" && !imageFile) return this.setStatus("Selecione uma imagem para iniciar a atividade.", true);
        if (this.selectedActivity !== "image" && !message) return;

        this.sending = true;
        this.setStatus(this.selectedActivity === "image" ? "Analisando a imagem..." : "O Mentor está preparando a resposta...");
        const sendButton = this.querySelector("#sendMentorMessage");
        if (sendButton) sendButton.disabled = true;
        this.abortController = new AbortController();
        try {
            if (this.selectedActivity === "image") {
                await sendMentorImageActivity(imageFile, message, { signal: this.abortController.signal });
            } else {
                await sendMentorMessage(message, { signal: this.abortController.signal });
            }
            this.selectedActivity = "";
            this.previewUrl = "";
            this.render();
        } catch (error) {
            this.setStatus(error.message || "Não foi possível enviar a atividade.", true);
        } finally {
            this.sending = false;
            this.abortController = null;
            if (sendButton) sendButton.disabled = false;
        }
    }

    setStatus(message, error = false) {
        const status = this.querySelector("#mentorStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("form-error", error);
    }

    scrollToEnd() {
        requestAnimationFrame(() => {
            const list = this.querySelector("#mentorMessages");
            if (list) list.scrollTop = list.scrollHeight;
        });
    }
}

if (!customElements.get("ef-mentor-page")) customElements.define("ef-mentor-page", EFMentorPage);
