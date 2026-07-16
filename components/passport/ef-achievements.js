import { state } from "../../core/state.js";
import { ACHIEVEMENT_CATALOG } from "../../data/achievement-catalog.js";

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}

function getCatalogAchievement(id) {
    return ACHIEVEMENT_CATALOG.find(
        (achievement) => achievement.id === id
    ) || null;
}

function normalizeAchievement(record) {
    const storedRecord =
        typeof record === "string"
            ? { id: record }
            : record || {};

    const catalogRecord = getCatalogAchievement(
        storedRecord.id
    ) || {};

    const merged = {
        ...catalogRecord,
        ...storedRecord
    };

    return {
        id: merged.id || globalThis.crypto?.randomUUID?.() || `achievement-${Date.now()}`,
        title: merged.title || "Conquista desbloqueada",
        description:
            merged.description ||
            "Uma nova etapa da sua aprendizagem foi registrada.",
        icon: merged.icon || "✨",
        image: merged.image || "",
        imageAlt:
            merged.imageAlt ||
            merged.title ||
            "Imagem da conquista",
        xp: Number.isFinite(Number(merged.xp))
            ? Number(merged.xp)
            : 0,
        category:
            merged.category ||
            merged.type ||
            "aprendizagem",
        type:
            merged.type ||
            mapCategoryToType(merged.category),
        language: merged.language || null,
        unlockedAt: merged.unlockedAt || null,
        metadata: merged.metadata || {}
    };
}

function mapCategoryToType(category) {
    const types = {
        onboarding: "milestone",
        consistency: "streak",
        professional: "challenge",
        speaking: "learning",
        passport: "experience",
        culture: "culture"
    };

    return types[category] || "learning";
}

function formatDate(value) {
    if (!value) {
        return "Registrada";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Registrada";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

export class EFAchievements extends HTMLElement {
    constructor() {
        super();

        this.handleAchievementUnlocked =
            this.handleAchievementUnlocked.bind(this);
    }

    connectedCallback() {
        this.render();

        window.addEventListener(
            "achievement-unlocked",
            this.handleAchievementUnlocked
        );
        window.addEventListener(
            "state-updated",
            this.handleAchievementUnlocked
        );
    }

    disconnectedCallback() {
        window.removeEventListener(
            "achievement-unlocked",
            this.handleAchievementUnlocked
        );
        window.removeEventListener(
            "state-updated",
            this.handleAchievementUnlocked
        );
    }

    handleAchievementUnlocked() {
        this.render();
    }

    getAchievements() {
        const records = Array.isArray(
            state.profile?.achievements
        )
            ? state.profile.achievements
            : [];

        return records
            .map(normalizeAchievement)
            .sort((a, b) => {
                const dateA = new Date(
                    a.unlockedAt || 0
                ).getTime();

                const dateB = new Date(
                    b.unlockedAt || 0
                ).getTime();

                return dateB - dateA;
            });
    }

    render() {
        const achievements = this.getAchievements();

        if (achievements.length === 0) {
            this.innerHTML = `
                <section class="passport-achievements-section">
                    <header class="passport-section-header">
                        <div>
                            <p class="eyebrow">
                                Diário de bordo
                            </p>

                            <h2>Conquistas</h2>
                        </div>

                        <span class="passport-achievements-count">
                            0
                        </span>
                    </header>

                    <div class="passport-empty-state">
                        <span
                            class="passport-empty-icon"
                            aria-hidden="true">
                            🏅
                        </span>

                        <strong>
                            Sua primeira conquista aparecerá aqui
                        </strong>

                        <p>
                            Complete atividades reais para registrar
                            novos marcos no passaporte.
                        </p>
                    </div>
                </section>
            `;

            return;
        }

        const cards = achievements
            .map((achievement) => {
                const languageName =
                    achievement.language?.name ||
                    "Conquista global";

                const languageFlag =
                    achievement.language?.flag ||
                    "🌍";

                const imageMarkup = achievement.image
                    ? `
                        <div class="achievement-media">
                            <img
                                class="achievement-image"
                                src="${escapeHTML(achievement.image)}"
                                alt="${escapeHTML(achievement.imageAlt)}">
                        </div>
                    `
                    : "";

                return `
                    <article
                        class="passport-achievement-card passport-achievement-card--${escapeHTML(achievement.type)}">

                        <header class="achievement-header">
                            <div class="achievement-language">
                                <span
                                    class="achievement-flag"
                                    aria-hidden="true">
                                    ${escapeHTML(languageFlag)}
                                </span>

                                <span class="achievement-language-info">
                                    <small>Contexto</small>
                                    <strong>
                                        ${escapeHTML(languageName)}
                                    </strong>
                                </span>
                            </div>

                            <span
                                class="achievement-icon"
                                aria-hidden="true">
                                ${escapeHTML(achievement.icon)}
                            </span>
                        </header>

                        ${imageMarkup}

                        <div class="achievement-content">
                            <span class="achievement-category">
                                ${escapeHTML(achievement.category)}
                            </span>

                            <h3 class="achievement-title">
                                ${escapeHTML(achievement.title)}
                            </h3>

                            <p class="achievement-description">
                                ${escapeHTML(achievement.description)}
                            </p>
                        </div>

                        <footer class="achievement-stats">
                            <div class="achievement-stat">
                                <small>XP</small>
                                <strong>${achievement.xp}</strong>
                            </div>

                            <div class="achievement-stat">
                                <small>Data</small>
                                <strong>
                                    ${escapeHTML(formatDate(achievement.unlockedAt))}
                                </strong>
                            </div>

                            <div class="achievement-stat">
                                <small>Tipo</small>
                                <strong>
                                    ${escapeHTML(achievement.type)}
                                </strong>
                            </div>
                        </footer>
                    </article>
                `;
            })
            .join("");

        this.innerHTML = `
            <section class="passport-achievements-section">
                <header class="passport-section-header">
                    <div>
                        <p class="eyebrow">
                            Diário de bordo
                        </p>

                        <h2>Conquistas</h2>
                    </div>

                    <span class="passport-achievements-count">
                        ${achievements.length}
                    </span>
                </header>

                <div class="passport-achievements-grid">
                    ${cards}
                </div>
            </section>
        `;
    }
}

if (!customElements.get("ef-achievements")) {
    customElements.define(
        "ef-achievements",
        EFAchievements
    );
}
