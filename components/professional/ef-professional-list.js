import { PROFESSIONAL_CATALOG } from "../../data/professional-catalog.js";
import { getUserTrack, selectProfessionalTrack } from "../../services/professional.js";

const escapeHTML = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
);

class EFProfessionalList extends HTMLElement {
    constructor() {
        super();
        this.handleStateChange = this.render.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
        this.render();
        this.addEventListener("click", this.handleClick);
        window.addEventListener("state-updated", this.handleStateChange);
        window.addEventListener("professional-track-changed", this.handleStateChange);
    }

    disconnectedCallback() {
        this.removeEventListener("click", this.handleClick);
        window.removeEventListener("state-updated", this.handleStateChange);
        window.removeEventListener("professional-track-changed", this.handleStateChange);
    }

    handleClick(event) {
        const button = event.target.closest("[data-track-id]");
        if (button) selectProfessionalTrack(button.dataset.trackId);
    }

    render() {
        const selectedId = getUserTrack()?.id || "";
        this.innerHTML = `
            <ul class="professional-board-grid professional-track-list">
                ${PROFESSIONAL_CATALOG.map((track) => {
                    const selected = track.id === selectedId;
                    return `
                        <li class="professional-track-list-item">
                            <button type="button"
                                class="professional-reviewer-card${selected ? " is-selected" : ""}"
                                data-track-id="${escapeHTML(track.id)}"
                                aria-pressed="${selected}">
                                <span class="professional-reviewer-icon" aria-hidden="true">${escapeHTML(track.icon)}</span>
                                <span class="professional-reviewer-info">
                                    <strong>${escapeHTML(track.title)}</strong>
                                    <small>${escapeHTML(track.difficulty)}</small>
                                </span>
                            </button>
                        </li>
                    `;
                }).join("")}
            </ul>
        `;
    }
}

if (!customElements.get("ef-professional-list")) {
    customElements.define("ef-professional-list", EFProfessionalList);
}
