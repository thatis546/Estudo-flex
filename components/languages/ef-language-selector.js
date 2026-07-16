import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import {
    isLanguageReady,
    selectLanguage
} from "../../services/language-profile.service.js";

export class EFLanguageSelector extends HTMLElement {
    constructor() {
        super();
        this.handleStateChange = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("state-updated", this.handleStateChange);
        window.addEventListener("language-changed", this.handleStateChange);
    }

    disconnectedCallback() {
        window.removeEventListener("state-updated", this.handleStateChange);
        window.removeEventListener("language-changed", this.handleStateChange);
    }

    render() {
        const selected = state.currentLanguage || "";
        this.innerHTML = `
            <label class="language-selector">
                <span class="language-selector-label">Idioma atual</span>
                <select class="language-selector-control" aria-label="Selecione o idioma de estudo">
                    <option value="" disabled ${selected ? "" : "selected"}>Selecione um idioma</option>
                    ${Object.entries(EF_LANGUAGES).map(([code, language]) => {
                        const record = state.getLanguage(code);
                        const suffix = record && !isLanguageReady(record) ? " — configurar" : "";
                        return `
                            <option value="${code}" ${code === selected ? "selected" : ""}>
                                ${language.flag || "🌍"} ${language.name}${suffix}
                            </option>
                        `;
                    }).join("")}
                </select>
            </label>
        `;
        this.querySelector("select")?.addEventListener("change", (event) => {
            const record = selectLanguage(event.target.value);
            if (record && !isLanguageReady(record)) router.navigate("language-setup");
        });
    }
}

if (!customElements.get("ef-language-selector")) {
    customElements.define("ef-language-selector", EFLanguageSelector);
}
