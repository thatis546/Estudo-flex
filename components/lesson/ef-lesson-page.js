import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { addActivityXP } from "../../services/achievement-service.js";
import { buildLanguageDailyPlan, isLanguageReady } from "../../services/language-profile.service.js";
import { buildFirstActivity, completeLearningActivity } from "../../services/lesson.service.js";
import { getReviewAvailability, formatNextReview } from "../../services/review.service.js";
import { storage } from "../../core/storage.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

class EFLessonPage extends HTMLElement {
    constructor() {
        super();
        this.index = 0;
        this.startedAt = 0;
    }

    connectedCallback() {}

    onRouteEnter() {
        const record = state.getLanguage(state.currentLanguage);
        if (!record) return router.navigate("languages", "replace");
        if (!isLanguageReady(record)) return router.navigate("language-setup", "replace");

        this.record = record;
        this.activity = buildFirstActivity(record);
        this.index = 0;
        this.startedAt = Date.now();
        this.render();
    }

    render() {
        const language = EF_LANGUAGES[this.record?.code] || this.record || {};
        if (!this.activity?.items?.length) {
            this.innerHTML = `
                <section class="lesson-page">
                    <article class="card lesson-empty-card">
                        <p class="eyebrow">CONTEÚDO INDISPONÍVEL</p>
                        <h1>A primeira atividade ainda não foi preparada para este idioma.</h1>
                        <button id="lessonBack" type="button" class="primary full">Voltar para a Home</button>
                    </article>
                </section>`;
            this.querySelector("#lessonBack")?.addEventListener("click", () => router.navigate("home"));
            return;
        }

        if (this.activity.completed) {
            const review = getReviewAvailability(this.record);
            this.innerHTML = `
                <section class="lesson-page">
                    <article class="card lesson-complete-card">
                        <span class="lesson-complete-icon" aria-hidden="true">✓</span>
                        <p class="eyebrow">ATIVIDADE JÁ CONCLUÍDA</p>
                        <h1>${escapeHTML(this.activity.title)}</h1>
                        <p>${review.status === "available"
                            ? `Você tem ${review.dueCount} ${review.dueCount === 1 ? "item" : "itens"} para revisar.`
                            : review.nextReviewAt
                                ? `A próxima revisão está programada para ${escapeHTML(formatNextReview(review.nextReviewAt))}.`
                                : "Continue pelo plano do dia para liberar novas revisões."}</p>
                        <div class="actions">
                            ${review.status === "available" ? '<button id="lessonReview" type="button" class="primary full">Abrir revisão</button>' : ""}
                            <button id="lessonHome" type="button" class="secondary full">Voltar para a Home</button>
                        </div>
                    </article>
                </section>`;
            this.querySelector("#lessonReview")?.addEventListener("click", () => router.navigate("review"));
            this.querySelector("#lessonHome")?.addEventListener("click", () => router.navigate("home"));
            return;
        }

        const item = this.activity.items[this.index];
        const last = this.index === this.activity.items.length - 1;
        const progress = ((this.index + 1) / this.activity.items.length) * 100;
        this.innerHTML = `
            <section class="lesson-page" aria-labelledby="lessonTitle">
                <header class="screen-header lesson-header">
                    <button id="leaveLesson" type="button" class="back-button" aria-label="Voltar">←</button>
                    <div>
                        <p class="eyebrow">PRIMEIRA ATIVIDADE · ${escapeHTML(this.activity.difficulty.label)}</p>
                        <h1 id="lessonTitle">${escapeHTML(language.name || this.record.name)}</h1>
                        <p>${escapeHTML(this.activity.difficulty.instruction)}</p>
                    </div>
                </header>
                <div class="progress-track" aria-label="Progresso da atividade"><span style="width:${progress}%"></span></div>

                <article class="card lesson-content-card">
                    <small>Expressão ${this.index + 1} de ${this.activity.items.length}</small>
                    <h2>${escapeHTML(item.front)}</h2>
                    <strong>${escapeHTML(item.back)}</strong>
                    <p>${escapeHTML(item.example || "")}</p>
                    <aside class="lesson-difficulty-note">
                        <strong>Dificuldade adaptada ao seu contato anterior</strong>
                        <span>${escapeHTML(this.activity.difficulty.instruction)}</span>
                    </aside>
                </article>

                <button id="nextLessonItem" type="button" class="primary full">
                    ${last ? "Concluir atividade" : "Entendi, continuar"}
                </button>
                <p class="lesson-review-note">A revisão só será liberada depois desta atividade e apenas com o conteúdo que você realmente viu.</p>
            </section>`;

        this.querySelector("#leaveLesson")?.addEventListener("click", () => router.navigate("home"));
        this.querySelector("#nextLessonItem")?.addEventListener("click", () => {
            if (!last) {
                this.index += 1;
                this.render();
                return;
            }
            this.finish();
        });
    }

    finish() {
        const completion = completeLearningActivity(this.activity, this.record);
        if (!completion) return;

        addActivityXP(10, {
            idempotencyKey: `lesson:${this.record.code}:${this.activity.id}`,
            reason: this.activity.title,
            languageCode: this.record.code,
            durationMinutes: Math.max(1, Math.ceil((Date.now() - this.startedAt) / 60000)),
            activity: { type: "lesson", title: this.activity.title }
        });
        this.record.dailyPlan = buildLanguageDailyPlan(this.record);
        state.updateDailyPlan(this.record.dailyPlan);
        storage.save();
        this.activity.completed = true;
        this.render();
    }
}

if (!customElements.get("ef-lesson-page")) customElements.define("ef-lesson-page", EFLessonPage);
