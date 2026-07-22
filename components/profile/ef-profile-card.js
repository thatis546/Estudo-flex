import { state } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import {
    getCurrentLanguageRecord,
    getEffectiveLearningProfile,
    getLanguageLevelLabel
} from "../../services/language-profile.service.js";
import { getProfileOptionLabel, getPurposeSummary } from "../../core/profile-options.js";
import { removeLanguageInterest } from "../../services/profile-privacy.service.js";
import { getUserTrack } from "../../services/professional.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

const FREQUENCY = { "1x": "1 vez por semana", "2x": "2 vezes por semana", "3x": "3 vezes por semana", "5x": "5 vezes por semana", daily: "Todos os dias" };
const DEADLINE = { "no-deadline": "Sem prazo fixo", "3-months": "3 meses", "6-months": "6 meses", "1-year": "1 ano", "2-years": "2 anos" };

class EFProfileCard extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        ["state-updated", "language-changed", "xp-earned", "professional-track-changed"].forEach((event) => window.addEventListener(event, this.refresh));
    }

    disconnectedCallback() {
        ["state-updated", "language-changed", "xp-earned", "professional-track-changed"].forEach((event) => window.removeEventListener(event, this.refresh));
    }

    render() {
        const profile = state.profile || {};
        const record = getCurrentLanguageRecord();
        const language = record ? EF_LANGUAGES[record.code] : null;
        const learningProfile = getEffectiveLearningProfile(record, profile);
        const purpose = getPurposeSummary(learningProfile.goal);
        const purposeDescription = learningProfile.goalDescription || purpose?.goalDescription || "Objetivo ainda não detalhado.";
        const purposeUseCase = learningProfile.useCase || purpose?.useCase || "Situação de uso ainda não definida.";
        const result = record?.diagnosticResult || {};
        const details = learningProfile.goalDetails || {};
        const stats = record?.stats || {};
        const interests = details.interests || [];
        const track = getUserTrack();
        const avatar = profile.avatar?.imageUrl || "./assets/avatars/default-user.svg";
        const recentActivities = profile.learning?.recentActivities || [];
        const languageOverview = state.languages.map((item) => {
            const catalog = EF_LANGUAGES[item.code] || item;
            const itemProfile = getEffectiveLearningProfile(item, item.code === state.currentLanguage ? profile : {});
            const itemDetails = itemProfile.goalDetails || {};
            const itemTrack = getUserTrack(item.code);
            const status = item.setupComplete && item.diagnosticResult?.completedAt
                ? item.journeyLabel || "Jornada definida"
                : "Configuração pendente";
            return `
                <article class="profile-language-summary ${item.code === state.currentLanguage ? "is-current" : ""}">
                    <div class="profile-language-summary__heading">
                        <span aria-hidden="true">${escapeHTML(catalog.flag || "🌍")}</span>
                        <div><strong>${escapeHTML(catalog.name || item.name || item.code)}</strong><small>${escapeHTML(status)}</small></div>
                    </div>
                    <dl>
                        <div><dt>Finalidade</dt><dd>${escapeHTML(getProfileOptionLabel(item.code, "goal", itemProfile.goal) || "Não definida")}</dd></div>
                        <div><dt>Uso concreto</dt><dd>${escapeHTML(itemProfile.useCase || "Não informado")}</dd></div>
                        <div><dt>Rotina</dt><dd>${Number(itemProfile.dailyMinutes) || 0} min · ${escapeHTML(FREQUENCY[itemDetails.frequency] || itemDetails.frequency || "sem frequência")}</dd></div>
                        <div><dt>Trilha profissional</dt><dd>${escapeHTML(itemTrack?.title || "Não selecionada")}</dd></div>
                    </dl>
                    <p>${escapeHTML(itemProfile.goalDescription || "Objetivo detalhado ainda não informado.")}</p>
                    <div class="profile-language-summary__tags">${(itemDetails.interests || []).map((interest) => `<span>${escapeHTML(interest)}</span>`).join("") || "<small>Sem interesses cadastrados.</small>"}</div>
                </article>`;
        }).join("");

        this.innerHTML = `
            <article class="profile-header-card">
                <div class="profile-avatar-wrapper">
                    <img class="profile-avatar profile-avatar--image" src="${escapeHTML(avatar)}" alt="Avatar de ${escapeHTML(profile.name || "Estudante")}">
                    <span class="profile-level-badge">${escapeHTML(record ? getLanguageLevelLabel(record) : "Sem idioma")}</span>
                </div>
                <div class="profile-info">
                    <p class="eyebrow">Perfil Vivo</p>
                    <h2 class="profile-name">${escapeHTML(profile.name || "Estudante")}</h2>
                    <p class="profile-username">${language ? `${escapeHTML(language.flag || "🌍")} ${escapeHTML(language.name)}` : "Nenhum idioma selecionado"}</p>
                    <span class="profile-rank">${escapeHTML(getProfileOptionLabel(record?.code, "goal", learningProfile.goal) || "Objetivo ainda não definido")}</span>
                    <p class="profile-join-date">${escapeHTML(purposeDescription)}</p>
                </div>
            </article>

            <ul class="profile-stats-grid" aria-label="Estatísticas do perfil">
                <li class="stat-card stat-card--xp"><span class="stat-icon-wrapper" aria-hidden="true">⭐</span><span class="stat-details"><small>XP por atividades</small><strong class="stat-value">${Number(profile.xp) || 0}</strong></span></li>
                <li class="stat-card stat-card--streak"><span class="stat-icon-wrapper" aria-hidden="true">🔥</span><span class="stat-details"><small>Sequência</small><strong class="stat-value">${Number(profile.learning?.streak) || 0} dias</strong></span></li>
                <li class="stat-card stat-card--lessons"><span class="stat-icon-wrapper" aria-hidden="true">⏱️</span><span class="stat-details"><small>Tempo estudado</small><strong class="stat-value">${Number(profile.learning?.totalStudyMinutes) || 0} min</strong></span></li>
                <li class="stat-card stat-card--fluency"><span class="stat-icon-wrapper" aria-hidden="true">🌍</span><span class="stat-details"><small>Idiomas</small><strong class="stat-value">${state.languages.length}</strong></span></li>
            </ul>

            <section class="card profile-section-card" aria-labelledby="profileLanguagesTitle">
                <header class="profile-section-heading"><div><p class="eyebrow">IDIOMAS INDEPENDENTES</p><h2 id="profileLanguagesTitle">Finalidade e progresso de cada língua</h2></div></header>
                <div class="profile-language-summary-grid">${languageOverview || "<p>Nenhum idioma configurado.</p>"}</div>
            </section>

            ${record ? `
                <section class="profile-detail-grid" aria-label="Contexto do idioma atual">
                    <article class="card profile-detail-card"><small>Jornada atual</small><h3>${escapeHTML(record.journeyLabel || "Diagnóstico pendente")}</h3><p>Ela continuará sendo ajustada conforme atividades e uso real.</p></article>
                    <article class="card profile-detail-card"><small>Onde será usado</small><h3>${escapeHTML(getProfileOptionLabel(record.code, "lifeContext", learningProfile.lifeContext) || "Não definido")}</h3><p>${escapeHTML(purposeUseCase)}</p></article>
                    <article class="card profile-detail-card"><small>Contato anterior</small><h3>${escapeHTML(getProfileOptionLabel(record.code, "contact", learningProfile.contact) || "Não informado")}</h3><p>A dificuldade inicial das atividades e revisões considera esta resposta.</p></article>
                    <article class="card profile-detail-card"><small>Tempo diário</small><h3>${Number(learningProfile.dailyMinutes) ? `${Number(learningProfile.dailyMinutes)} minutos` : "Não definido"}</h3><p>Tempo disponível por sessão para esta língua.</p></article>
                    <article class="card profile-detail-card"><small>Frequência</small><h3>${escapeHTML(FREQUENCY[details.frequency] || details.frequency || "Não definida")}</h3><p>Ritmo semanal informado no onboarding.</p></article>
                    <article class="card profile-detail-card"><small>Prazo</small><h3>${escapeHTML(DEADLINE[details.deadline] || details.deadline || "Sem prazo fixo")}</h3><p>${escapeHTML(track?.title || "Nenhuma trilha profissional selecionada")}</p></article>
                </section>

                <section class="card profile-section-card">
                    <header class="profile-section-heading"><div><p class="eyebrow">PERSONALIZAÇÃO</p><h2>Interesses de ${escapeHTML(language?.name || record.name)}</h2></div></header>
                    <div class="profile-removable-tags">
                        ${interests.length ? interests.map((interest) => `<span class="profile-removable-tag"><span>${escapeHTML(interest)}</span><button type="button" data-remove-interest="${escapeHTML(interest)}" aria-label="Excluir interesse ${escapeHTML(interest)}">×</button></span>`).join("") : "<p>Interesses ainda não definidos. O Perfil Vivo poderá descobri-los com as atividades.</p>"}
                    </div>
                </section>

                <section class="profile-evidence-grid">
                    <article class="card"><p class="eyebrow">PONTOS OBSERVADOS</p><ul>${(result.strengths || []).length ? result.strengths.map((item) => `<li>${escapeHTML(item)}</li>`).join("") : "<li>Ainda reunindo evidências.</li>"}</ul></article>
                    <article class="card"><p class="eyebrow">PRÓXIMOS FOCOS</p><ul>${(result.developmentAreas || []).length ? result.developmentAreas.map((item) => `<li>${escapeHTML(item)}</li>`).join("") : "<li>Ainda reunindo evidências.</li>"}</ul></article>
                </section>

                <section class="card profile-section-card">
                    <p class="eyebrow">ATIVIDADES E MÉTRICAS DESTA LÍNGUA</p>
                    <div class="profile-inline-stats"><span>Revisões: <strong>${Number(stats.reviewsCompleted) || 0}</strong></span><span>Sessões de oratória: <strong>${Number(stats.communicationSessions) || 0}</strong></span><span>Palavras conhecidas: <strong>${Number(stats.knownWords) || 0}</strong></span><span>XP: <strong>${Number(record.xp) || 0}</strong></span></div>
                </section>
            ` : ""}

            <section class="card profile-section-card">
                <p class="eyebrow">HISTÓRICO RECENTE</p>
                ${recentActivities.length ? `<ul class="profile-activity-list">${recentActivities.slice(0, 8).map((activity) => `<li><strong>${escapeHTML(activity.label || activity.title || activity.type || "Atividade")}</strong><small>${escapeHTML(activity.languageCode || "global")} · ${escapeHTML(new Date(activity.completedAt || Date.now()).toLocaleDateString("pt-BR"))}</small></li>`).join("")}</ul>` : "<p>Nenhuma atividade concluída ainda.</p>"}
            </section>
        `;

        this.querySelectorAll("[data-remove-interest]").forEach((button) => {
            button.addEventListener("click", () => removeLanguageInterest(record.code, button.dataset.removeInterest));
        });
    }
}

if (!customElements.get("ef-profile-card")) customElements.define("ef-profile-card", EFProfileCard);
