import { state } from "../../core/state.js";

class EFLanguageList extends HTMLElement {
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
        const languages = Array.isArray(state.languages) ? state.languages : [];
        this.innerHTML = languages.length
            ? `<ul class="language-list">${languages.map((item) => `<li>${item.flag || "🌍"} ${item.name || item.code.toUpperCase()} — ${item.level || "A1"}</li>`).join("")}</ul>`
            : `<p>Nenhum idioma adicionado.</p>`;
    }
}

if (!customElements.get("ef-language-list")) customElements.define("ef-language-list", EFLanguageList);
