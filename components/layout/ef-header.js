import { router } from "../../core/router.js";

class EFHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header class="ef-header">
                <button type="button" class="ef-header__action" data-route="languages" aria-label="Idiomas">🌍</button>
                <div class="ef-header__brand">
                    <strong>Estudo Flex</strong>
                    <small>Languages</small>
                </div>
                <button type="button" class="ef-header__action" data-route="profile" aria-label="Perfil">👤</button>
            </header>
        `;

        this.handleClick = (event) => {
            const control = event.target.closest("[data-route]");
            if (control) router.navigate(control.dataset.route);
        };
        this.addEventListener("click", this.handleClick);
    }

    disconnectedCallback() {
        this.removeEventListener("click", this.handleClick);
    }
}

if (!customElements.get("ef-header")) customElements.define("ef-header", EFHeader);
