import { state } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";

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

function getCurrentLanguageCode() {
    const current = state.currentLanguage;

    if (typeof current === "string") {
        return current.trim().toLowerCase();
    }

    if (current && typeof current === "object") {
        return String(current.code || current.id || "")
            .trim()
            .toLowerCase();
    }

    return "";
}

function getPassportLanguages() {
    const records = Array.isArray(state.languages)
        ? state.languages
        : [];

    return records
        .map((record) => {
            const code = String(
                record?.code || record?.id || ""
            )
                .trim()
                .toLowerCase();

            if (!code) {
                return null;
            }

            const configuration = EF_LANGUAGES[code] || {};

            return {
                code,
                name:
                    record.name ||
                    record.label ||
                    configuration.name ||
                    code.toUpperCase(),
                flag:
                    record.flag ||
                    configuration.flag ||
                    "🌍",
                level:
                    record.level ||
                    state.profile?.levelTag ||
                    "A1"
            };
        })
        .filter(Boolean);
}

export class EFPassportCard extends HTMLElement {
    constructor() {
        super();

        this.handleStateChange =
            this.handleStateChange.bind(this);
    }

    connectedCallback() {
        this.render();

        window.addEventListener(
            "language-changed",
            this.handleStateChange
        );

        window.addEventListener(
            "state-updated",
            this.handleStateChange
        );
    }

    disconnectedCallback() {
        window.removeEventListener(
            "language-changed",
            this.handleStateChange
        );

        window.removeEventListener(
            "state-updated",
            this.handleStateChange
        );
    }

    handleStateChange() {
        this.render();
    }

    render() {
        const profile = state.profile || {};
        const languages = getPassportLanguages();
        const currentCode = getCurrentLanguageCode();

        const currentLanguage =
            languages.find(
                (language) => language.code === currentCode
            ) || languages[0] || null;

        const studentName =
            profile.name?.trim() || "Estudante";

        const languageNames = languages.length
            ? languages
                .map((language) => language.name)
                .join(" • ")
            : "Nenhum idioma adicionado";

        const currentLevel =
            currentLanguage?.level ||
            profile.levelTag ||
            "A1";

        const totalXP = Number.isFinite(
            Number(profile.xp)
        )
            ? Number(profile.xp)
            : 0;

        const dailyMinutes = Number.isFinite(
            Number(profile.dailyMinutes)
        )
            ? Number(profile.dailyMinutes)
            : 0;

        this.innerHTML = `
            <article
                class="passport-bio-page"
                aria-label="Dados do passaporte de aprendizagem">

                <div class="passport-photo-frame">
                    <img
                        class="passport-photo"
                        src="./assets/avatars/default-user.svg"
                        alt="Avatar de ${escapeHTML(studentName)}">
                </div>

                <div class="passport-bio-details">
                    <div class="passport-bio-field">
                        <span class="passport-bio-label">
                            Estudante
                        </span>

                        <strong class="passport-bio-value">
                            ${escapeHTML(studentName)}
                        </strong>
                    </div>

                    <div class="passport-bio-field">
                        <span class="passport-bio-label">
                            Idioma atual
                        </span>

                        <strong class="passport-bio-value">
                            ${currentLanguage
                                ? `${escapeHTML(currentLanguage.flag)} ${escapeHTML(currentLanguage.name)}`
                                : "Não selecionado"}
                        </strong>
                    </div>

                    <div class="passport-bio-field">
                        <span class="passport-bio-label">
                            Idiomas
                        </span>

                        <strong class="passport-bio-value">
                            ${escapeHTML(languageNames)}
                        </strong>
                    </div>

                    <div class="passport-bio-field">
                        <span class="passport-bio-label">
                            Nível atual
                        </span>

                        <strong class="passport-bio-value">
                            ${escapeHTML(currentLevel)}
                        </strong>
                    </div>

                    <div class="passport-bio-field">
                        <span class="passport-bio-label">
                            XP total
                        </span>

                        <strong class="passport-bio-value">
                            ${totalXP}
                        </strong>
                    </div>

                    <div class="passport-bio-field">
                        <span class="passport-bio-label">
                            Meta diária
                        </span>

                        <strong class="passport-bio-value">
                            ${dailyMinutes > 0
                                ? `${dailyMinutes} min`
                                : "Não definida"}
                        </strong>
                    </div>
                </div>
            </article>
        `;
    }
}

if (!customElements.get("ef-passport-card")) {
    customElements.define(
        "ef-passport-card",
        EFPassportCard
    );
}
