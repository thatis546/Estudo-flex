import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import {
    getCurrentLanguageRecord,
    getEffectiveLearningProfile,
    isLanguageReady
} from "../../services/language-profile.service.js";
import { getProfessionalProgress, getUserTrack } from "../../services/professional.js";
import { getContactDifficulty, hasCompletedLearningActivity } from "../../services/lesson.service.js";
import { formatNextReview, getReviewAvailability } from "../../services/review.service.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

class EFHomePage extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        ["state-updated", "language-changed", "professional-track-changed", "xp-earned", "learning-activity-completed"].forEach((eventName) => {
            window.addEventListener(eventName, this.refresh);
        });
    }

    disconnectedCallback() {
        ["state-updated", "language-changed", "professional-track-changed", "xp-earned", "learning-activity-completed"].forEach((eventName) => {
            window.removeEventListener(eventName, this.refresh);
        });
    }

    buildReviewCard(record, language, plan) {
        const availability = getReviewAvailability(record);
        const hasActivity = hasCompletedLearningActivity(record);
        const learningProfile = getEffectiveLearningProfile(record, state.profile);
        const difficulty = getContactDifficulty(learningProfile.contact);

        if (!hasActivity || availability.status === "no-activity" || availability.status === "no-items") {
            return `
                <article class="home-action-card home-action-card--first-activity">
                    <span class="home-action-icon" aria-hidden="true">1</span>
                    <div>
                        <small>Primeiro conteúdo · ${escapeHTML(difficulty.label)}</small>
                        <h3>Inicie uma atividade antes da revisão</h3>
                        <p>${escapeHTML(difficulty.instruction)} A revisão será criada somente com o conteúdo realmente estudado.</p>
                    </div>
                    <button id="startFirstActivityButton" type="button" class="primary full">Iniciar primeira atividade</button>
                </article>`;
        }

        if (availability.status === "scheduled") {
            return `
                <article class="home-action-card home-action-card--review-waiting">
                    <span class="home-action-icon" aria-hidden="true">🕒</span>
                    <div>
                        <small>Vocabulário Vivo · revisão programada</small>
                        <h3>Nada para revisar agora</h3>
                        <p>Próxima revisão: ${escapeHTML(formatNextReview(availability.nextReviewAt))}. O intervalo considera seu contato anterior e suas respostas.</p>
                    </div>
                    <button id="continueLearningButton" type="button" class="secondary full">Fazer conteúdo novo</button>
                </article>`;
        }

        return `
            <article class="home-action-card">
                <span class="home-action-icon" aria-hidden="true">↻</span>
                <div>
                    <small>Vocabulário Vivo · ${availability.dueCount} ${availability.dueCount === 1 ? "item disponível" : "itens disponíveis"}</small>
                    <h3>${escapeHTML(plan.review || `Revisão de ${language?.name || record.name}`)}</h3>
                    <p>Revise apenas palavras e expressões que já apareceram em atividades concluídas.</p>
                </div>
                <button id="startReviewButton" type="button" class="primary full">Começar revisão</button>
            </article>`;
    }

    render() {
        const profile = state.profile || {};
        const learning = profile.learning || {};
        const record = getCurrentLanguageRecord();
        const language = record ? EF_LANGUAGES[record.code] : null;
        const ready = isLanguageReady(record);
        const plan = record?.dailyPlan || profile.dailyPlan || {};
        const professionalTrack = getUserTrack();
        const professionalProgress = getProfessionalProgress();
        const onboardingComplete = state.isOnboardingCompleted();
        const onboardingPaused = Boolean(profile.onboardingProgress?.paused);

        if (!onboardingComplete) {
            this.innerHTML = `
                <section class="home-page home-page--paused">
                    <div class="home-status-bar">
                        <div class="home-status-group">
                            <span class="status-indicator status-indicator--xp">⭐ 0 XP de atividades</span>
                            <span class="status-indicator status-indicator--streak">🔥 0 dias</span>
                        </div>
                    </div>
                    <article class="learning-unit-card home-welcome-card">
                        <span class="learning-unit-badge">Configuração salva</span>
                        <h1 class="learning-unit-title">Olá, ${escapeHTML(profile.name || "estudante")}!</h1>
                        <p class="learning-unit-description">Você pode conhecer a Home agora e retomar exatamente de onde parou.</p>
                    </article>
                    <article class="card home-empty-action home-onboarding-resume">
                        <p class="eyebrow">PRIMEIROS PASSOS</p>
                        <h2>${onboardingPaused ? "Sua configuração está pausada" : "Termine a configuração inicial"}</h2>
                        <p>As atividades só serão montadas depois que objetivo, rotina e diagnóstico deste idioma estiverem completos.</p>
                        <button id="resumeOnboardingButton" type="button" class="primary full">Continuar configuração</button>
                    </article>
                </section>`;
            this.querySelector("#resumeOnboardingButton")?.addEventListener("click", () => router.navigate(router.getResumePage()));
            return;
        }

        this.innerHTML = `
            <section class="home-page">
                <div class="home-status-bar">
                    <div class="home-status-group">
                        <span class="status-indicator status-indicator--xp">⭐ ${Number(profile.xp) || 0} XP de atividades</span>
                        <span class="status-indicator status-indicator--streak">🔥 ${Number(learning.streak) || 0} dias</span>
                    </div>
                </div>

                <article class="learning-unit-card home-welcome-card">
                    <span class="learning-unit-badge">Plano de hoje</span>
                    <h1 class="learning-unit-title">Olá, ${escapeHTML(profile.name || "estudante")}!</h1>
                    <p class="learning-unit-description">
                        ${language ? `${escapeHTML(language.flag || "🌍")} ${escapeHTML(language.name)}` : "Selecione um idioma"}
                        ${ready ? ` · ${escapeHTML(record.journeyLabel || "Jornada pendente")} · ${Number(getEffectiveLearningProfile(record, profile).dailyMinutes) || 15} minutos` : ""}
                    </p>
                </article>

                ${!record ? `
                    <article class="card home-empty-action">
                        <h2>Escolha seu primeiro idioma</h2>
                        <p>Cada língua terá objetivos, contexto, diagnóstico, revisões e progresso próprios.</p>
                        <button id="homeChooseLanguage" type="button" class="primary full">Escolher idioma</button>
                    </article>
                ` : !ready ? `
                    <article class="card home-empty-action">
                        <h2>Conclua a configuração de ${escapeHTML(language?.name || record.name)}</h2>
                        <p>Antes de criar um plano, precisamos entender por que, onde e como você usará esta língua e realizar um diagnóstico próprio.</p>
                        <button id="homeConfigureLanguage" type="button" class="primary full">Configurar idioma</button>
                    </article>
                ` : `
                    <section class="home-section" aria-labelledby="homeStudyTitle">
                        <div class="home-section-heading"><div><p class="eyebrow">IDIOMA GERAL</p><h2 id="homeStudyTitle">Estudo de hoje</h2></div></div>
                        <div class="home-action-grid">
                            ${this.buildReviewCard(record, language, plan)}
                            <article class="home-action-card">
                                <span class="home-action-icon" aria-hidden="true">▶</span>
                                <div><small>Conteúdo novo</small><h3>${escapeHTML(plan.lesson || "Próxima atividade")}</h3><p>A dificuldade parte do contato informado e será ajustada pelo desempenho real.</p></div>
                                <button id="startLessonButton" type="button" class="secondary full">Abrir atividade</button>
                            </article>
                            <article class="home-action-card">
                                <span class="home-action-icon" aria-hidden="true">🎙️</span>
                                <div><small>Communication Lab</small><h3>${escapeHTML(plan.communication || "Treino técnico de oratória")}</h3><p>Analise ritmo, clareza, muletas, repetições, projeção e variedade lexical.</p></div>
                                <button id="openSpeakingButton" type="button" class="secondary full">Abrir Communication Lab</button>
                            </article>
                            <article class="home-action-card home-action-card--mentor">
                                <span class="home-action-icon" aria-hidden="true">💬</span>
                                <div><small>Meu Mentor</small><h3>Conversa pedagógica em texto</h3><p>Tire dúvidas, peça explicações e receba atividades baseadas no Perfil Vivo.</p></div>
                                <button id="openMentorButton" type="button" class="secondary full">Conversar com Mentor</button>
                            </article>
                        </div>
                    </section>`}

                <section class="home-section" aria-labelledby="homeProfessionalTitle">
                    <div class="home-section-heading"><div><p class="eyebrow">PROFESSIONAL LAB</p><h2 id="homeProfessionalTitle">Trilha profissional de ${escapeHTML(language?.name || "idioma")}</h2></div></div>
                    <article class="home-professional-card">
                        <span class="home-professional-icon" aria-hidden="true">${escapeHTML(professionalTrack?.icon || "💼")}</span>
                        <div class="home-professional-content">
                            <small>${professionalTrack ? `${professionalProgress}% concluído` : "Nenhuma trilha selecionada"}</small>
                            <h3>${escapeHTML(professionalTrack?.title || "Escolha uma área profissional")}</h3>
                            <p>${escapeHTML(professionalTrack?.description || "A trilha fica separada do idioma geral e mantém progresso próprio para esta língua.")}</p>
                        </div>
                        <button id="homeProfessionalButton" type="button" class="primary">${professionalTrack ? "Começar ou continuar" : "Escolher trilha"}</button>
                    </article>
                </section>
            </section>`;

        this.querySelector("#homeChooseLanguage")?.addEventListener("click", () => router.navigate("languages"));
        this.querySelector("#homeConfigureLanguage")?.addEventListener("click", () => router.navigate("language-setup"));
        this.querySelector("#startFirstActivityButton")?.addEventListener("click", () => router.navigate("lesson"));
        this.querySelector("#continueLearningButton")?.addEventListener("click", () => router.navigate("lesson"));
        this.querySelector("#startReviewButton")?.addEventListener("click", () => router.navigate("review"));
        this.querySelector("#startLessonButton")?.addEventListener("click", () => router.navigate("lesson"));
        this.querySelector("#openSpeakingButton")?.addEventListener("click", () => router.navigate("speaking"));
        this.querySelector("#openMentorButton")?.addEventListener("click", () => router.navigate("mentor"));
        this.querySelector("#homeProfessionalButton")?.addEventListener("click", () => router.navigate(professionalTrack ? "professional-study" : "professional"));
    }
}

if (!customElements.get("ef-home-page")) customElements.define("ef-home-page", EFHomePage);
