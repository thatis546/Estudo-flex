import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { registerAchievementEvent } from "../../services/achievement-service.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

class EFFinish extends HTMLElement {
    connectedCallback() {}

    onRouteEnter() {
        this.profile = state.profile;
        if (!this.profile?.name) {
            router.navigate("welcome", "replace");
            return;
        }
        if (!this.profile.levelResult?.completedAt) {
            router.navigate("level-test", "replace");
            return;
        }

        const interest = this.profile.goalDetails?.interests?.[0] || "seus temas selecionados";
        const currentPlan = this.profile.dailyPlan || {};
        const plan = {
            review: currentPlan.review || "Revisão rápida de vocabulário básico",
            lesson: currentPlan.lesson || "Expressões essenciais de conversação",
            communication: currentPlan.communication || `Communication Lab sobre “${interest}”`
        };
        state.updateDailyPlan(plan);
        const languageRecord = state.getLanguage(state.currentLanguage);
        if (languageRecord) languageRecord.dailyPlan = { ...plan };
        storage.save();
        this.render(plan);
    }

    render(plan) {
        const language = EF_LANGUAGES[this.profile.language];
        const languageName = language?.name || this.profile.language || "Não definido";
        const mentorName = language?.mentor || "Seu mentor virtual";
        const timeDisplay = Number(this.profile.dailyMinutes) > 0
            ? `${Number(this.profile.dailyMinutes)} minutos`
            : "A definir";
        const journeyDisplay = this.profile.journeyLabel || this.profile.levelTag || "Diagnóstico pendente";
        const interests = this.profile.goalDetails?.interests?.length
            ? this.profile.goalDetails.interests.join(", ")
            : "Temas variados";

        this.innerHTML = `
            <div class="screen-header">
                <p class="eyebrow">ONBOARDING CONCLUÍDO</p>
                <h1>Tudo pronto, ${escapeHTML(this.profile.name)}! 🎉</h1>
            </div>
            <article class="journey-card">
                <h2 class="question-title">Seu plano personalizado</h2>
                <p class="finish-description">Preparamos sua trilha adaptativa com base nas suas preferências e no diagnóstico inicial.</p>
                <ul class="finish-list">
                    <li class="fact"><strong>Idioma</strong><small>${escapeHTML(languageName)}</small></li>
                    <li class="fact"><strong>Mentor</strong><small>${escapeHTML(mentorName)}</small></li>
                    <li class="fact"><strong>Jornada inicial</strong><small>${escapeHTML(journeyDisplay)}</small></li>
                    <li class="fact"><strong>Tempo diário</strong><small>${escapeHTML(timeDisplay)}</small></li>
                    <li class="fact"><strong>Interesses</strong><small>${escapeHTML(interests)}</small></li>
                </ul>
                <div class="mentor-section">
                    <span class="slider-label">Sua primeira aula</span>
                    <ul class="finish-list finish-plan-list">
                        <li class="small-text">✓ <strong>${escapeHTML(plan.review)}</strong></li>
                        <li class="small-text">✓ <strong>${escapeHTML(plan.lesson)}</strong></li>
                        <li class="small-text">✓ <strong>${escapeHTML(plan.communication)}</strong></li>
                    </ul>
                </div>
                <div class="mentor-section">
                    <p class="small-text italic finish-note">💡 Seu plano evoluirá conforme você aprende e revisa.</p>
                </div>
            </article>
            <div class="actions">
                <button id="enterApp" type="button" class="primary full">Começar meus estudos</button>
            </div>
        `;

        this.querySelector("#enterApp").addEventListener("click", () => {
            registerAchievementEvent("onboarding-completed");
            storage.finishOnboarding();
            router.navigate("home", "replace");
        });
    }
}

if (!customElements.get("ef-finish")) customElements.define("ef-finish", EFFinish);
