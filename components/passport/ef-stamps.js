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

function getLanguageRecords() {
    const storedLanguages = Array.isArray(state.languages)
        ? state.languages
        : [];

    const records = [...storedLanguages];

    const currentCode =
        typeof state.currentLanguage === "string"
            ? state.currentLanguage.trim().toLowerCase()
            : String(
                state.currentLanguage?.code ||
                state.currentLanguage?.id ||
                ""
            )
                .trim()
                .toLowerCase();

    const alreadyIncluded = records.some((record) =>
        String(record?.code || record?.id || "")
            .trim()
            .toLowerCase() === currentCode
    );

    if (
        currentCode &&
        !alreadyIncluded &&
        EF_LANGUAGES[currentCode]
    ) {
        const configuration = EF_LANGUAGES[currentCode];

        records.push({
            code: currentCode,
            name: configuration.name,
            flag: configuration.flag,
            journey: "Pendente",
            setupComplete: false
        });
    }

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
                country:
                    record.country ||
                    configuration.country ||
                    "Experiência internacional",
                journey: record.setupComplete && (record.journeyLabel || record.level)
                    ? (record.journeyLabel || record.level)
                    : "Pendente",
                setupComplete: Boolean(record.setupComplete)
            };
        })
        .filter(Boolean);
}

export class EFStamps extends HTMLElement {
    constructor() {
        super();

        this.handleLanguageChange =
            this.handleLanguageChange.bind(this);
    }

    connectedCallback() {
        this.render();

        window.addEventListener(
            "language-changed",
            this.handleLanguageChange
        );
        window.addEventListener(
            "state-updated",
            this.handleLanguageChange
        );
    }

    disconnectedCallback() {
        window.removeEventListener(
            "language-changed",
            this.handleLanguageChange
        );
        window.removeEventListener(
            "state-updated",
            this.handleLanguageChange
        );
    }

    handleLanguageChange() {
        this.render();
    }

    render() {
        const languages = getLanguageRecords();

        if (languages.length === 0) {
            this.innerHTML = `
                <section class="passport-stamps-section">
                    <h2 class="passport-section-title">
                        Vistos linguísticos
                    </h2>

                    <div class="passport-empty-state">
                        <span
                            class="passport-empty-icon"
                            aria-hidden="true">
                            🌍
                        </span>

                        <strong>
                            Nenhum idioma adicionado
                        </strong>

                        <p>
                            Adicione um idioma para receber o
                            primeiro carimbo do seu passaporte.
                        </p>
                    </div>
                </section>
            `;

            return;
        }

        const stamps = languages
            .map((language) => `
                <article
                    class="visa-stamp visa-stamp--${escapeHTML(language.code)} ${language.setupComplete ? "is-stamped" : "is-locked"}"
                    title="${escapeHTML(language.name)} — ${escapeHTML(language.country)}"
                    aria-label="${language.setupComplete ? `Carimbo de ${escapeHTML(language.name)}, jornada ${escapeHTML(language.journey)}` : `Idioma ${escapeHTML(language.name)} com configuração pendente`}">

                    <span
                        class="visa-stamp-flag"
                        aria-hidden="true">
                        ${escapeHTML(language.flag)}
                    </span>

                    <strong class="visa-stamp-code">
                        ${escapeHTML(language.code)}
                    </strong>

                    <span class="visa-stamp-level">
                        ${escapeHTML(language.journey)}
                    </span>
                </article>
            `)
            .join("");

        this.innerHTML = `
            <section class="passport-stamps-section">
                <h2 class="passport-section-title">
                    Vistos linguísticos
                </h2>

                <div class="passport-stamps-grid">
                    ${stamps}
                </div>
            </section>
        `;
    }
}

if (!customElements.get("ef-stamps")) {
    customElements.define(
        "ef-stamps",
        EFStamps
    );
}
