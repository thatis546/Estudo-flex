import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import {
    formatNextReview,
    getCurrentReviewQueue,
    getReviewAvailability,
    recordReviewAnswer
} from "../../services/review.service.js";
import { isLanguageReady } from "../../services/language-profile.service.js";
import { addActivityXP } from "../../services/achievement-service.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

export class EFReviewPage extends HTMLElement {
    constructor() {
        super();
        this.index = 0;
        this.revealed = false;
        this.completed = false;
        this.sessionId = "";
        this.startedAt = 0;
    }

    connectedCallback() {}

    onRouteEnter() {
        const record = state.getLanguage(state.currentLanguage);
        if (!record) return router.navigate("languages", "replace");
        if (!isLanguageReady(record)) return router.navigate("language-setup", "replace");

        this.record = record;
        this.availability = getReviewAvailability(record);
        this.queue = getCurrentReviewQueue();
        this.index = 0;
        this.revealed = false;
        this.completed = false;
        this.sessionId = globalThis.crypto?.randomUUID?.() || `review-${Date.now()}`;
        this.startedAt = Date.now();
        this.render();
    }

    renderUnavailable() {
        const language = EF_LANGUAGES[this.record?.code] || this.record || {};
        const noActivity = this.availability.status === "no-activity" || this.availability.status === "no-items";
        const title = noActivity
            ? "A revisão ainda não foi liberada"
            : "Nada para revisar agora";
        const description = noActivity
            ? `Primeiro faça uma atividade de ${language.name || this.record.name}. A revisão receberá somente palavras e expressões que você realmente estudou.`
            : `Sua próxima revisão está programada para ${formatNextReview(this.availability.nextReviewAt)}. O intervalo considera seu contato anterior e seu desempenho.`;

        this.innerHTML = `
            <section class="review-page">
                <article class="card review-empty-card">
                    <span class="review-empty-icon" aria-hidden="true">${noActivity ? "📘" : "🕒"}</span>
                    <p class="eyebrow">VOCABULÁRIO VIVO</p>
                    <h1>${escapeHTML(title)}</h1>
                    <p>${escapeHTML(description)}</p>
                    <div class="actions">
                        <button id="startLearningBeforeReview" type="button" class="primary full">
                            ${noActivity ? "Iniciar primeira atividade" : "Fazer outra atividade"}
                        </button>
                        <button id="reviewUnavailableHome" type="button" class="secondary full">Voltar para a Home</button>
                    </div>
                </article>
            </section>`;
        this.querySelector("#startLearningBeforeReview")?.addEventListener("click", () => router.navigate("lesson"));
        this.querySelector("#reviewUnavailableHome")?.addEventListener("click", () => router.navigate("home"));
    }

    render() {
        const language = EF_LANGUAGES[this.record?.code] || {};
        if (this.availability.status !== "available" || this.queue.length === 0) {
            this.renderUnavailable();
            return;
        }

        if (this.completed || this.index >= this.queue.length) {
            this.innerHTML = `
                <section class="review-page">
                    <article class="card review-complete-card">
                        <span class="review-complete-icon" aria-hidden="true">✓</span>
                        <p class="eyebrow">REVISÃO CONCLUÍDA</p>
                        <h1>${this.queue.length} ${this.queue.length === 1 ? "item revisado" : "itens revisados"}</h1>
                        <p>Os próximos intervalos foram programados conforme suas respostas e seu contato com ${escapeHTML(language.name || this.record.name)}.</p>
                        <div class="actions">
                            <button id="reviewNextActivity" type="button" class="secondary full">Fazer conteúdo novo</button>
                            <button id="reviewHome" type="button" class="primary full">Voltar para a Home</button>
                        </div>
                    </article>
                </section>`;
            this.querySelector("#reviewNextActivity")?.addEventListener("click", () => router.navigate("lesson"));
            this.querySelector("#reviewHome")?.addEventListener("click", () => router.navigate("home"));
            return;
        }

        const item = this.queue[this.index];
        const progress = ((this.index + 1) / Math.max(1, this.queue.length)) * 100;
        this.innerHTML = `
            <section class="review-page" aria-labelledby="reviewPageTitle">
                <header class="screen-header">
                    <button id="leaveReview" type="button" class="back-button" aria-label="Voltar">←</button>
                    <div>
                        <p class="eyebrow">VOCABULÁRIO VIVO</p>
                        <h1 id="reviewPageTitle">Revisão de ${escapeHTML(language.name || this.record.name)}</h1>
                        <p>Item ${this.index + 1} de ${this.queue.length} · conteúdo visto em ${escapeHTML(item.sourceActivityTitle || "uma atividade anterior")}</p>
                    </div>
                </header>
                <div class="progress-track" aria-label="Progresso da revisão"><span style="width:${progress}%"></span></div>

                <article class="review-card ${this.revealed ? "is-revealed" : ""}">
                    <span class="review-card-label">Palavra ou expressão estudada</span>
                    <h2>${escapeHTML(item.front)}</h2>
                    ${this.revealed ? `
                        <div class="review-answer">
                            <strong>${escapeHTML(item.back)}</strong>
                            <p>${escapeHTML(item.example || "")}</p>
                        </div>
                    ` : `
                        <button id="revealReviewAnswer" type="button" class="primary">Mostrar resposta</button>
                    `}
                </article>

                ${this.revealed ? `
                    <div class="review-rating-grid" aria-label="Como foi esta revisão?">
                        <button type="button" class="secondary" data-rating="forgot">Não lembrei</button>
                        <button type="button" class="secondary" data-rating="hard">Difícil</button>
                        <button type="button" class="primary" data-rating="known">Lembrei</button>
                    </div>
                ` : ""}
            </section>`;

        this.querySelector("#leaveReview")?.addEventListener("click", () => router.navigate("home"));
        this.querySelector("#revealReviewAnswer")?.addEventListener("click", () => {
            this.revealed = true;
            this.render();
        });
        this.querySelectorAll("[data-rating]").forEach((button) => {
            button.addEventListener("click", () => this.answer(button.dataset.rating));
        });
    }

    answer(rating) {
        const item = this.queue[this.index];
        if (!item) return;
        recordReviewAnswer(item.id, rating);
        this.index += 1;
        this.revealed = false;
        if (this.index >= this.queue.length) {
            this.completed = true;
            addActivityXP(5, {
                idempotencyKey: `review:${this.record.code}:${this.sessionId}`,
                reason: `Revisão de ${this.record.name}`,
                languageCode: this.record.code,
                durationMinutes: Math.max(1, Math.ceil((Date.now() - this.startedAt) / 60000)),
                activity: { type: "review", title: "Revisão de conteúdo estudado" }
            });
        }
        this.render();
    }
}

if (!customElements.get("ef-review-page")) customElements.define("ef-review-page", EFReviewPage);
