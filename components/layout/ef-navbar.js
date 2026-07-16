import { router } from "../../core/router.js";

class EFNavbar extends HTMLElement {
    constructor() {
        super();
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
        this.innerHTML = `
            <nav class="ef-navbar" aria-label="Navegação principal">
                <button type="button" class="ef-navbar__item" data-route="home"><span aria-hidden="true">🏠</span><small>Home</small></button>
                <button type="button" class="ef-navbar__item" data-route="mentor"><span aria-hidden="true">💬</span><small>Mentor</small></button>
                <button type="button" class="ef-navbar__item" data-route="speaking"><span aria-hidden="true">🎙️</span><small>Oratória</small></button>
                <button type="button" class="ef-navbar__item" data-route="professional"><span aria-hidden="true">💼</span><small>Profissional</small></button>
                <button type="button" class="ef-navbar__item" data-route="passport"><span aria-hidden="true">🛂</span><small>Passaporte</small></button>
            </nav>
        `;
        this.addEventListener("click", this.handleClick);
        window.addEventListener("routechange", this.handleRouteChange);
        this.update(router.getCurrentPage());
    }

    disconnectedCallback() {
        this.removeEventListener("click", this.handleClick);
        window.removeEventListener("routechange", this.handleRouteChange);
    }

    handleClick(event) {
        const control = event.target.closest("[data-route]");
        if (control) router.navigate(control.dataset.route);
    }

    handleRouteChange(event) {
        this.update(event.detail?.page || router.getCurrentPage());
    }

    update(page) {
        this.querySelectorAll("[data-route]").forEach((control) => {
            const active = control.dataset.route === page;
            control.classList.toggle("active", active);
            if (active) control.setAttribute("aria-current", "page");
            else control.removeAttribute("aria-current");
        });
    }
}

if (!customElements.get("ef-navbar")) customElements.define("ef-navbar", EFNavbar);
