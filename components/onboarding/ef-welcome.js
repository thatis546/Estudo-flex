import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state } from "../../core/state.js";

class EFWelcome extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    onRouteEnter() {
        this.render();
    }

    render() {
        const savedName = state.profile?.name || "";
        const hasProgress = Boolean(savedName && state.profile?.onboardingProgress?.step > 0);

        this.innerHTML = `
            <article class="welcome-card">
                <div class="brand-orbit" aria-hidden="true">
                    <span class="orbit-dot"></span>
                    <span class="brand-globe">🌍</span>
                </div>
                <h1>Bem-vindo ao Estudo Flex Languages</h1>
                <p>${hasProgress
                    ? "Sua configuração foi salva. Continue de onde parou."
                    : "Cada pessoa aprende de um jeito. Vamos construir uma jornada pensada para você."}</p>
                <label for="welcomeName">Como você prefere ser chamado?</label>
                <input id="welcomeName" placeholder="Seu nome ou apelido" autocomplete="name" type="text" value="">
                <button id="welcomeContinue" type="button" class="primary full">
                    ${hasProgress ? "Continuar configuração" : "Continuar"}
                </button>
            </article>
        `;

        const input = this.querySelector("#welcomeName");
        input.value = savedName;
        const button = this.querySelector("#welcomeContinue");

        window.setTimeout(() => input.focus(), 100);
        button.addEventListener("click", () => this.continue(input));
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.continue(input);
            }
        });
    }

    continue(input) {
        const name = input.value.trim();
        if (!name) {
            this.showToast("Por favor, digite seu nome ou apelido.");
            input.focus();
            return;
        }
        state.updateProfile({ name });
        storage.save();
        router.navigate("onboarding");
    }

    showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2200);
    }
}

if (!customElements.get("ef-welcome")) customElements.define("ef-welcome", EFWelcome);
