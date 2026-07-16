import { generateAchievementIllustration } from "../../services/achievement-image.service.js";
import { shareAchievement } from "../../services/share.service.js";
import { validateAchievementConsistency } from "../../services/achievement-service.js";

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
}

function formatDate(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return "Data registrada";
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "short", year: "numeric"
    }).format(date);
}

export class EFAchievementCard extends HTMLElement {
    set achievement(value) {
        this._achievement = value || null;
        if (this.isConnected) this.render();
    }

    get achievement() {
        return this._achievement;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const item = this._achievement;
        if (!item) {
            this.innerHTML = "";
            return;
        }

        const consistency = validateAchievementConsistency(item);
        if (!consistency.valid) {
            this.innerHTML = `
                <article class="achievement-card achievement-card--invalid" role="alert">
                    <strong>Conquista temporariamente indisponível</strong>
                    <p>Os dados não passaram pela verificação de consistência.</p>
                </article>
            `;
            return;
        }

        const language = item.language || {};
        const media = item.illustration || item.avatar?.imageUrl || "./assets/avatars/default-user.svg";
        const hasGeneratedScene = Boolean(item.illustration);
        const xp = Math.max(0, Number(item.xpEarned) || 0);
        const streak = Math.max(0, Number(item.streakDays) || 0);

        this.innerHTML = `
            <article class="achievement-card" data-achievement-key="${escapeHTML(item.key || item.id)}">
                <header class="achievement-card__language">
                    <span class="achievement-card__flag" aria-hidden="true">${escapeHTML(language.flag || "🌍")}</span>
                    <div>
                        <strong>${escapeHTML(language.name || "Idioma")}</strong>
                        <small>${escapeHTML(language.nativeName || "")}</small>
                    </div>
                    <span class="achievement-card__stamp" aria-label="Conquista desbloqueada">Conquista<br>desbloqueada</span>
                </header>

                <div class="achievement-card__hero">
                    <div class="achievement-card__copy">
                        <p class="eyebrow">EXPERIÊNCIA REGISTRADA</p>
                        <h3>${escapeHTML(item.title)}</h3>
                        <p>${escapeHTML(item.description)}</p>
                    </div>
                    <figure class="achievement-card__media">
                        <img src="${escapeHTML(media)}" alt="${escapeHTML(item.imageAlt || item.title)}">
                        ${hasGeneratedScene ? "" : `
                            <button type="button" class="achievement-card__generate" data-action="generate-image">
                                Criar cena com meu avatar
                            </button>
                        `}
                    </figure>
                </div>

                <dl class="achievement-card__stats">
                    <div><dt>Data</dt><dd>${escapeHTML(formatDate(item.unlockedAt))}</dd></div>
                    <div><dt>XP da atividade</dt><dd>+${xp} XP</dd></div>
                    <div><dt>Sequência</dt><dd>${streak} ${streak === 1 ? "dia" : "dias"}</dd></div>
                    <div><dt>Estudante</dt><dd>${escapeHTML(item.userName || "Estudante")}</dd></div>
                </dl>

                <footer class="achievement-card__footer">
                    <p>🌍 Cada experiência leva você mais longe.</p>
                    <button type="button" class="secondary compact" data-action="share">Compartilhar</button>
                </footer>
                <p class="achievement-card__status" role="status" aria-live="polite"></p>
            </article>
        `;

        this.querySelector('[data-action="share"]')?.addEventListener("click", () => this.handleShare());
        this.querySelector('[data-action="generate-image"]')?.addEventListener("click", () => this.handleGenerate());
    }

    setStatus(message, isError = false) {
        const status = this.querySelector(".achievement-card__status");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("is-error", isError);
    }

    async handleShare() {
        const button = this.querySelector('[data-action="share"]');
        if (button) button.disabled = true;
        this.setStatus("Preparando o card...");
        try {
            const result = await shareAchievement(this._achievement);
            this.setStatus(result.downloaded ? "Imagem salva para compartilhamento." : "Compartilhamento aberto.");
        } catch (error) {
            if (error?.name !== "AbortError") this.setStatus(error?.message || "Não foi possível compartilhar.", true);
        } finally {
            if (button) button.disabled = false;
        }
    }

    async handleGenerate() {
        const button = this.querySelector('[data-action="generate-image"]');
        if (button) button.disabled = true;
        this.setStatus("Gerando uma cena coerente com a conquista...");
        try {
            const updated = await generateAchievementIllustration(this._achievement.key || this._achievement.id);
            this._achievement = updated;
            this.render();
            this.setStatus("Ilustração criada.");
        } catch (error) {
            this.setStatus(error?.message || "Não foi possível gerar a ilustração.", true);
            if (button) button.disabled = false;
        }
    }
}

if (!customElements.get("ef-achievement-card")) {
    customElements.define("ef-achievement-card", EFAchievementCard);
}
