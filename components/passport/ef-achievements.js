import { state } from "../../core/state.js";
import { getUnlockedAchievements } from "../../services/achievement-service.js";

export class EFAchievements extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("achievement-unlocked", this.refresh);
        window.addEventListener("state-updated", this.refresh);
    }

    disconnectedCallback() {
        window.removeEventListener("achievement-unlocked", this.refresh);
        window.removeEventListener("state-updated", this.refresh);
    }

    render() {
        const achievements = getUnlockedAchievements().sort((a, b) =>
            new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime()
        );

        this.innerHTML = `
            <section class="passport-achievements-section" aria-labelledby="passportAchievementsTitle">
                <header class="passport-section-header">
                    <div><p class="eyebrow">DIÁRIO DE BORDO</p><h2 id="passportAchievementsTitle">Conquistas</h2></div>
                    <span class="passport-achievements-count" aria-label="${achievements.length} conquistas">${achievements.length}</span>
                </header>
                <div class="passport-achievements-list"></div>
            </section>
        `;

        const list = this.querySelector(".passport-achievements-list");
        if (!achievements.length) {
            list.innerHTML = `
                <div class="passport-empty-state">
                    <span class="passport-empty-icon" aria-hidden="true">🏅</span>
                    <strong>Sua primeira conquista aparecerá aqui</strong>
                    <p>Conclua experiências e atividades reais. Configurar o aplicativo não concede XP.</p>
                </div>
            `;
            return;
        }

        achievements.forEach((achievement) => {
            const card = document.createElement("ef-achievement-card");
            card.achievement = {
                ...achievement,
                userName: achievement.userName || state.profile.name,
                avatar: achievement.avatar || state.profile.avatar
            };
            list.appendChild(card);
        });
    }
}

if (!customElements.get("ef-achievements")) {
    customElements.define("ef-achievements", EFAchievements);
}
