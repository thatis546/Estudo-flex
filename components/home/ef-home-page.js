import { state } from "../../core/state.js";
import { router } from "../../core/router.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character])
);

class EFHomePage extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("state-updated", this.refresh);
    }

    disconnectedCallback() {
        window.removeEventListener("state-updated", this.refresh);
    }

    render() {
        const profile = state.profile || {};
        const learning = profile.learning || {};
        const plan = profile.dailyPlan || {};

        this.innerHTML = `
            <section class="home-page">
                <div class="home-status-bar">
                    <div class="home-status-group">
                        <span class="status-indicator status-indicator--xp">
                            ⭐ ${Number(profile.xp) || 0} XP
                        </span>
                        <span class="status-indicator status-indicator--streak">
                            🔥 ${Number(learning.streak) || 0} dias
                        </span>
                    </div>
                </div>

                <div class="learning-path-container">
                    <article class="learning-unit-card">
                        <span class="learning-unit-badge">Plano de hoje</span>
                        <h1 class="learning-unit-title">
                            Olá, ${escapeHTML(profile.name || "estudante")}!
                        </h1>
                        <p class="learning-unit-description">
                            ${escapeHTML(profile.levelTag || "A1")} ·
                            ${Number(profile.dailyMinutes) || 15} minutos disponíveis
                        </p>
                    </article>

                    <div class="path-nodes-grid">
                        <div class="lesson-node is-active">
                            <button
                                class="lesson-node-button"
                                id="startReviewButton"
                                type="button"
                                aria-label="Iniciar revisão do plano do dia">
                                ↻
                            </button>
                            <span class="lesson-node-label">
                                ${escapeHTML(plan.review || "Começar revisão")}
                            </span>
                        </div>

                        <div class="lesson-node">
                            <button
                                class="lesson-node-button"
                                id="startLessonButton"
                                type="button"
                                aria-label="Abrir a lição principal do plano do dia">
                                ▶
                            </button>
                            <span class="lesson-node-label">
                                ${escapeHTML(plan.lesson || "Começar nova lição")}
                            </span>
                        </div>

                        <div class="lesson-node">
                            <button
                                class="lesson-node-button"
                                id="openSpeakingButton"
                                type="button"
                                aria-label="Abrir prática de conversação">
                                🎙️
                            </button>
                            <span class="lesson-node-label">
                                ${escapeHTML(plan.conversation || "Praticar conversação")}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        `;

        this.querySelector("#startReviewButton")?.addEventListener(
            "click",
            () => router.navigate("languages")
        );
        this.querySelector("#startLessonButton")?.addEventListener(
            "click",
            () => router.navigate("languages")
        );
        this.querySelector("#openSpeakingButton")?.addEventListener(
            "click",
            () => router.navigate("speaking")
        );
    }
}

if (!customElements.get("ef-home-page")) {
    customElements.define("ef-home-page", EFHomePage);
}
