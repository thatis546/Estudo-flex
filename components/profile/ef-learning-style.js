import { state } from "../../core/state.js";
import { getCurrentLanguageRecord, getEffectiveLearningProfile } from "../../services/language-profile.service.js";
import { getLearningStyleLabel } from "../../core/profile-options.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
const LABELS = { immediate: "Correção imediata", final: "Correção ao final", silent: "Sem interrupções", pt: "Explicações em português", guided: "Imersão guiada", immersive: "Imersão ampliada" };

class EFLearningStyle extends HTMLElement {
    constructor() { super(); this.refresh = this.render.bind(this); }
    connectedCallback() { this.render(); window.addEventListener("state-updated", this.refresh); window.addEventListener("language-changed", this.refresh); }
    disconnectedCallback() { window.removeEventListener("state-updated", this.refresh); window.removeEventListener("language-changed", this.refresh); }

    render() {
        const profile = state.profile || {};
        const record = getCurrentLanguageRecord();
        const languageProfile = getEffectiveLearningProfile(record, profile);
        const style = getLearningStyleLabel(languageProfile.learningStyle || profile.learningStyle) || "Ainda em análise";
        const support = LABELS[profile.supportMode] || "Suporte adaptativo";
        const correction = LABELS[profile.mentor?.correctionStyle] || "Correção ao final";
        const minutes = Number(languageProfile.dailyMinutes || profile.dailyMinutes) || 0;
        this.innerHTML = `
            <section class="profile-preferences-grid" aria-label="Preferências de aprendizagem">
                <article class="card profile-preference-card"><span class="profile-preference-icon" aria-hidden="true">🎧</span><div><small>Forma de aprendizagem</small><h3>${escapeHTML(style)}</h3><p>Hipótese editável, refinada pelo Perfil Vivo.</p></div></article>
                <article class="card profile-preference-card"><span class="profile-preference-icon" aria-hidden="true">💬</span><div><small>Apoio do mentor</small><h3>${escapeHTML(support)}</h3><p>${escapeHTML(correction)}</p></div></article>
                <article class="card profile-preference-card"><span class="profile-preference-icon" aria-hidden="true">⏱️</span><div><small>Meta desta língua</small><h3>${minutes ? `${minutes} minutos por sessão` : "Não definida"}</h3></div></article>
                <article class="card profile-preference-card"><span class="profile-preference-icon" aria-hidden="true">🧠</span><div><small>Memória da IA</small><h3>${profile.aiMemory?.enabled ? "Ativada" : "Desativada"}</h3><p>${profile.aiMemory?.items?.length || 0} aprendizados visíveis.</p></div></article>
            </section>
        `;
    }
}

if (!customElements.get("ef-learning-style")) customElements.define("ef-learning-style", EFLearningStyle);
