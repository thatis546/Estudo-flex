import { state } from "../../core/state.js";
import { PROFESSIONAL_CATALOG } from "../../data/professional-catalog.js";
import { getUserTrack, selectProfessionalTrack } from "../../services/professional.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

class EFProfessionalList extends HTMLElement {
    constructor() { super(); this.refresh = this.render.bind(this); }
    connectedCallback() { this.render(); this.addEventListener("click", this.handleClick); window.addEventListener("state-updated", this.refresh); window.addEventListener("professional-track-changed", this.refresh); }
    disconnectedCallback() { this.removeEventListener("click", this.handleClick); window.removeEventListener("state-updated", this.refresh); window.removeEventListener("professional-track-changed", this.refresh); }
    handleClick = (event) => { const button = event.target.closest("[data-track-id]"); if (button) selectProfessionalTrack(button.dataset.trackId, state.currentLanguage); };
    render() {
        const selectedId = getUserTrack(state.currentLanguage)?.id || "";
        this.innerHTML = `<ul class="professional-board-grid professional-track-list">${PROFESSIONAL_CATALOG.map((track) => `<li class="professional-track-list-item"><button type="button" class="professional-reviewer-card${track.id === selectedId ? " is-selected" : ""}" data-track-id="${escapeHTML(track.id)}" aria-pressed="${track.id === selectedId}"><span class="professional-reviewer-icon" aria-hidden="true">${escapeHTML(track.icon)}</span><span class="professional-reviewer-info"><strong>${escapeHTML(track.title)}</strong><small>${escapeHTML(track.difficulty)} · ${track.subareas?.length || 0} módulos</small></span></button></li>`).join("")}</ul>`;
    }
}

if (!customElements.get("ef-professional-list")) customElements.define("ef-professional-list", EFProfessionalList);
