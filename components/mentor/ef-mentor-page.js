import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { getMentorConversation, sendMentorMessage, clearMentorConversation } from "../../services/mentor-chat.service.js";
import { isLanguageReady } from "../../services/language-profile.service.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

class EFMentorPage extends HTMLElement {
    constructor() {
        super();
        this.sending = false;
        this.abortController = null;
    }

    connectedCallback() {}

    disconnectedCallback() {
        this.abortController?.abort();
    }

    onRouteEnter() {
        const record = state.getLanguage(state.currentLanguage);
        if (!record) {
            router.navigate("languages", "replace");
            return;
        }
        if (!isLanguageReady(record)) {
            router.navigate("language-setup", "replace");
            return;
        }
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
                        <h1 id="mentorPageTitle">Conversa pedagógica em texto</h1>
                        <p>O Mentor orienta estudos, explica dúvidas e usa apenas as memórias autorizadas no Perfil Vivo. A Oratória fica separada no Communication Lab.</p>
                    </div>
                    <span class="communication-language-badge">${escapeHTML(this.language.flag || "🌍")} ${escapeHTML(this.language.name)} · ${escapeHTML(this.record.journeyLabel)}</span>
                </header>

                <article class="card mentor-context-card">
                    <div><small>Objetivo desta língua</small><strong>${escapeHTML(this.record.learningProfile?.goalDescription || this.record.learningProfile?.goal || "Não definido")}</strong></div>
                    <div><small>Situação de uso</small><strong>${escapeHTML(this.record.learningProfile?.useCase || "Não definida")}</strong></div>
                    <div><small>Memórias autorizadas</small><strong>${state.profile.aiMemory?.enabled ? state.profile.aiMemory.items.length : "desativadas"}</strong></div>
                </article>

                <section class="mentor-chat-shell">
                    <div id="mentorMessages" class="mentor-message-list" aria-live="polite">
                        ${messages.length ? messages.map((message) => this.messageMarkup(message)).join("") : `
                            <div class="mentor-empty-state"><img src="./assets/avatars/mentor-neutral.svg" alt=""><h2>Como posso ajudar hoje?</h2><p>Peça uma explicação, um plano, uma correção de texto ou ajuda para conectar o idioma ao seu objetivo.</p></div>
                        `}
                    </div>
                    <form id="mentorForm" class="mentor-composer">
                        <label class="sr-only" for="mentorInput">Mensagem para o Mentor</label>
                        <textarea id="mentorInput" class="text-input" rows="3" maxlength="3000" placeholder="Digite sua dúvida ou peça uma atividade..."></textarea>
                        <div class="mentor-composer-actions">
                            <button id="clearMentorChat" type="button" class="secondary">Limpar conversa</button>
                            <button id="sendMentorMessage" type="submit" class="primary">Enviar</button>
                        </div>
                    </form>
                    <p id="mentorStatus" class="form-help" role="status"></p>
                </section>
            </section>
        `;

        this.querySelector("#mentorForm")?.addEventListener("submit", (event) => {
            event.preventDefault();
            this.send();
        });
        this.querySelector("#clearMentorChat")?.addEventListener("click", () => {
            if (globalThis.confirm?.("Limpar apenas o histórico desta conversa? As memórias do Perfil Vivo são gerenciadas no Perfil.")) {
                clearMentorConversation(this.record.code);
                this.render();
            }
        });
        this.scrollToEnd();
    }

    messageMarkup(message) {
        return `
            <article class="mentor-message mentor-message--${message.role === "user" ? "user" : "assistant"}">
                <small>${message.role === "user" ? "Você" : "Mentor"}${message.offline ? " · modo local" : ""}</small>
                <p>${escapeHTML(message.text)}</p>
            </article>
        `;
    }

    async send() {
        if (this.sending) return;
        const input = this.querySelector("#mentorInput");
        const message = String(input?.value || "").trim();
        if (!message) return;
        this.sending = true;
        input.value = "";
        this.setStatus("O Mentor está preparando a resposta...");
        const sendButton = this.querySelector("#sendMentorMessage");
        if (sendButton) sendButton.disabled = true;
        this.abortController = new AbortController();
        try {
            await sendMentorMessage(message, { signal: this.abortController.signal });
            this.render();
        } catch (error) {
            this.setStatus(error.message || "Não foi possível enviar a mensagem.", true);
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
