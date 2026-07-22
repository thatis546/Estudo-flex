import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state } from "../../core/state.js";
import { getProfileOptionLabel, getPurposeSummary } from "../../core/profile-options.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { buildLanguageDailyPlan, getCurrentLanguageRecord } from "../../services/language-profile.service.js";
import { registerAchievementEvent } from "../../services/achievement-service.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

const FREQUENCY = {
    "1x": "1 dia por semana", "2x": "2 dias por semana", "3x": "3 dias por semana",
    "5x": "5 dias por semana", daily: "todos os dias"
};

class EFFinish extends HTMLElement {
    connectedCallback() {}

    onRouteEnter() {
        const profile = state.profile || {};
        const record = getCurrentLanguageRecord() || state.getLanguage(profile.language);
        if (!profile.name) return router.navigate("welcome", "replace");
        if (!record?.diagnosticResult?.completedAt) return router.navigate("level-test", "replace");

        this.profile = profile;
        this.record = record;
        const plan = buildLanguageDailyPlan(record);
        record.dailyPlan = { ...plan };
        state.updateDailyPlan(plan);
        storage.save();
        this.render(plan);
    }

    render(plan) {
        const language = EF_LANGUAGES[this.record.code] || this.record;
        const learningProfile = this.record.learningProfile || {};
        const details = learningProfile.goalDetails || {};
        const purpose = getPurposeSummary(learningProfile.goal);
        const interests = Array.isArray(details.interests) ? details.interests.filter(Boolean) : [];
        const interestsDisplay = interests.includes("Descobrir meus interesses aos poucos")
            ? "O aplicativo descobrirá seus temas com o uso"
            : interests.join(", ");
        const dailyMinutes = Number(learningProfile.dailyMinutes || this.profile.dailyMinutes) || 0;

        this.innerHTML = `
            <section class="finish-page" aria-labelledby="finishTitle">
                <header class="screen-header finish-header">
                    <p class="eyebrow">ONBOARDING CONCLUÍDO</p>
                    <h1 id="finishTitle">Tudo pronto, ${escapeHTML(this.profile.name)}! 🎉</h1>
                    <p>Confira as informações que serão usadas no seu primeiro plano.</p>
                </header>

                <article class="journey-card finish-summary-card">
                    <div class="finish-summary-heading">
                        <span aria-hidden="true">${escapeHTML(language.flag || "🌍")}</span>
                        <div><small>Seu plano personalizado</small><h2>${escapeHTML(language.name || this.record.name)}</h2></div>
                    </div>

                    <dl class="finish-facts">
                        <div><dt>Jornada inicial</dt><dd>${escapeHTML(this.record.journeyLabel || "Explorando")}</dd></div>
                        <div><dt>Mentor</dt><dd>${escapeHTML(language.mentor || "Mentor do idioma")}</dd></div>
                        <div><dt>Finalidade</dt><dd>${escapeHTML(purpose?.label || getProfileOptionLabel(this.record.code, "goal", learningProfile.goal) || "A descobrir")}</dd></div>
                        <div><dt>Tempo diário</dt><dd>${dailyMinutes ? `${dailyMinutes} minutos` : "Ainda não definido"}</dd></div>
                        <div><dt>Frequência</dt><dd>${escapeHTML(FREQUENCY[details.frequency] || "Ainda não definida")}</dd></div>
                        <div><dt>Interesses</dt><dd>${escapeHTML(interestsDisplay || "Ainda não selecionados")}</dd></div>
                    </dl>

                    <section class="finish-first-plan" aria-labelledby="firstPlanTitle">
                        <p class="eyebrow">SUA PRIMEIRA SESSÃO</p>
                        <h3 id="firstPlanTitle">Comece sem conteúdo inventado</h3>
                        <ul>
                            <li><span>1</span><div><strong>${escapeHTML(plan.review)}</strong><small>Vocabulário e expressões realmente disponíveis no idioma.</small></div></li>
                            <li><span>2</span><div><strong>${escapeHTML(plan.lesson)}</strong><small>Conteúdo relacionado à finalidade e aos interesses escolhidos.</small></div></li>
                            <li><span>3</span><div><strong>${escapeHTML(plan.communication)}</strong><small>Análise técnica de fala; a conversa com o Mentor fica em outra aba.</small></div></li>
                        </ul>
                    </section>
                </article>

                <div class="actions finish-actions">
                    <button id="editFinishData" type="button" class="secondary">Revisar respostas</button>
                    <button id="enterApp" type="button" class="primary">Começar meus estudos</button>
                </div>
            </section>
        `;

        this.querySelector("#editFinishData")?.addEventListener("click", () => router.navigate("goals"));
        this.querySelector("#enterApp")?.addEventListener("click", () => {
            registerAchievementEvent("onboarding-completed");
            storage.finishOnboarding();
            router.navigate("home", "replace");
        });
    }
}

if (!customElements.get("ef-finish")) customElements.define("ef-finish", EFFinish);
