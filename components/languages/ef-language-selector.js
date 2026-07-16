import { state } from "../../core/state.js";
import { storage } from "../../core/storage.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { checkMetricAchievements } from "../../services/achievement-service.js";

const CEFR_LEVELS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export class EFLanguageSelector extends HTMLElement {
    constructor() {
        super();
        this.handleStateChange = this.handleStateChange.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("state-updated", this.handleStateChange);
    }

    disconnectedCallback() {
        window.removeEventListener("state-updated", this.handleStateChange);
    }

    handleStateChange() {
        this.render();
    }

    render() {
        const selected = state.currentLanguage || "";
        this.innerHTML = `
            <label class="language-selector">
                <span class="language-selector-label">Idioma atual</span>
                <select class="language-selector-control" aria-label="Selecione o idioma de estudo">
                    <option value="" disabled ${selected ? "" : "selected"}>Selecione um idioma</option>
                    ${Object.entries(EF_LANGUAGES).map(([code, language]) => `
                        <option value="${code}" ${code === selected ? "selected" : ""}>
                            ${language.flag || "🌍"} ${language.name}
                        </option>
                    `).join("")}
                </select>
            </label>
        `;
        this.querySelector("select")?.addEventListener("change", (event) => {
            this.selectLanguage(event.target.value);
        });
    }

    selectLanguage(code) {
        const configuration = EF_LANGUAGES[code];
        if (!configuration) return;

        const isNew = !state.getLanguage(code);
        const record = state.addLanguage({
            code,
            name: configuration.name,
            flag: configuration.flag || "🌍",
            mentor: configuration.mentor || "",
            level: isNew ? "A1" : state.getLanguage(code)?.level || "A1",
            xp: state.getLanguage(code)?.xp || 0,
            progress: state.getLanguage(code)?.progress || 0,
            stats: state.getLanguage(code)?.stats || {}
        });

        state.setCurrentLanguage(code);
        const levelResult = record.levelResult || {
            cefr: record.level || "A1",
            score: 0,
            confidence: 0,
            strengths: [],
            weaknesses: [],
            completedAt: null
        };

        state.updateProfile({
            levelTag: record.level || "A1",
            level: CEFR_LEVELS[record.level] || 1,
            diagnosticScore: Number(record.diagnosticScore) || 0,
            diagnosticAnswers: Array.isArray(record.diagnosticAnswers)
                ? [...record.diagnosticAnswers]
                : [],
            diagnosticProgress: {
                step: 0,
                answers: [],
                scores: [],
                currentDifficulty: 3
            },
            levelResult
        });
        storage.save();

        if (isNew) {
            checkMetricAchievements("languagesCount", state.languages.length);
        }

        window.dispatchEvent(new CustomEvent("language-changed", {
            detail: { code, language: configuration, record }
        }));
    }
}

if (!customElements.get("ef-language-selector")) {
    customElements.define("ef-language-selector", EFLanguageSelector);
}
