import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state } from "../../core/state.js";
import { getPurposeSummary } from "../../core/profile-options.js";

const DEFAULT_INTERESTS = [
    "Filmes e séries", "Música", "Tecnologia", "Engenharia",
    "Negócios", "Viagens", "Esportes", "Gastronomia",
    "História", "Ciência", "Literatura", "Vida cotidiana"
];

const DISCOVER_INTERESTS = "Descobrir meus interesses aos poucos";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

class EFGoals extends HTMLElement {
    constructor() {
        super();
        this.selectedDeadline = "";
        this.selectedFrequency = "";
        this.selectedInterests = new Set();
        this.availableInterests = [...DEFAULT_INTERESTS];
    }

    connectedCallback() {}

    onRouteEnter() {
        if (!state.profile?.name) {
            router.navigate("welcome", "replace");
            return;
        }
        const saved = state.profile.goalDetails || {};
        this.selectedDeadline = saved.deadline || "";
        this.selectedFrequency = saved.frequency || "";
        this.selectedInterests = new Set(
            Array.isArray(saved.interests) ? saved.interests.filter(Boolean) : []
        );
        this.availableInterests = Array.from(new Set([
            ...DEFAULT_INTERESTS,
            ...this.selectedInterests
        ])).filter((item) => item !== DISCOVER_INTERESTS);
        this.render();
    }

    render() {
        const purpose = getPurposeSummary(state.profile.goal);
        const purposeLabel = purpose?.label || "Objetivo ainda não escolhido";
        const useCase = state.profile.useCase || purpose?.useCase || "A situação de uso será refinada durante as atividades.";

        this.innerHTML = `
            <section class="goals-page" aria-labelledby="goalsTitle">
                <header class="screen-header">
                    <p class="eyebrow">PASSO 2 DE 3</p>
                    <h1 id="goalsTitle">Complete a rotina deste idioma</h1>
                    <p>Seu objetivo já foi escolhido na conversa inicial. Agora faltam apenas prazo, frequência e assuntos.</p>
                </header>

                <article class="card goals-purpose-summary">
                    <small>Finalidade escolhida</small>
                    <h2>${escapeHTML(purposeLabel)}</h2>
                    <p>${escapeHTML(useCase)}</p>
                    <button id="editPurposeButton" type="button" class="text-button">Alterar essa resposta</button>
                </article>

                <article class="card goals-form-card">
                    <fieldset class="mentor-section">
                        <legend class="slider-label">Existe algum prazo importante?</legend>
                        <div id="deadlineGroup" class="choice-grid choice-grid--compact">
                            ${this.optionButton("no-deadline", "Sem prazo fixo")}
                            ${this.optionButton("3-months", "Até 3 meses")}
                            ${this.optionButton("6-months", "Até 6 meses")}
                            ${this.optionButton("1-year", "Até 1 ano")}
                            ${this.optionButton("2-years", "Até 2 anos")}
                        </div>
                    </fieldset>

                    <fieldset class="mentor-section">
                        <legend class="slider-label">Quantos dias por semana você pretende estudar?</legend>
                        <div id="frequencyGroup" class="choice-grid choice-grid--compact">
                            ${this.optionButton("1x", "1 dia")}
                            ${this.optionButton("2x", "2 dias")}
                            ${this.optionButton("3x", "3 dias")}
                            ${this.optionButton("5x", "5 dias")}
                            ${this.optionButton("daily", "Todos os dias")}
                        </div>
                    </fieldset>

                    <fieldset class="mentor-section">
                        <legend class="slider-label">Quais assuntos você gostaria de encontrar nas atividades?</legend>
                        <p class="form-help">Você pode selecionar vários, adicionar um assunto próprio ou deixar o aplicativo descobrir isso com o uso.</p>
                        <button id="discoverInterestsButton" type="button" class="choice-card choice-card--discover" aria-pressed="${this.selectedInterests.has(DISCOVER_INTERESTS)}">
                            <strong>Quero descobrir meus interesses aos poucos</strong>
                            <small>O Perfil Vivo observará quais temas ajudam você a continuar estudando.</small>
                        </button>
                        <div id="interestsGroup" class="tag-list" aria-label="Interesses disponíveis"></div>
                        <div class="tag-editor">
                            <label class="sr-only" for="customTagInput">Adicionar outro assunto</label>
                            <input id="customTagInput" type="text" maxlength="40" placeholder="Adicionar outro assunto...">
                            <button id="addTagButton" type="button" class="secondary compact">Adicionar</button>
                        </div>
                    </fieldset>
                </article>

                <div class="actions goals-actions">
                    <button id="goalsBackButton" type="button" class="secondary">Voltar</button>
                    <button id="goalsNextButton" type="button" class="primary">Avançar para o diagnóstico</button>
                </div>
            </section>
        `;

        this.renderInterests();
        this.bindEvents();
    }

    optionButton(value, label) {
        return `<button type="button" class="quick-reply" data-val="${value}">${label}</button>`;
    }

    renderInterests() {
        const container = this.querySelector("#interestsGroup");
        if (!container) return;
        container.innerHTML = "";
        this.availableInterests.forEach((interest) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "tag";
            button.textContent = interest;
            const selected = this.selectedInterests.has(interest);
            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
            button.addEventListener("click", () => {
                this.selectedInterests.delete(DISCOVER_INTERESTS);
                if (this.selectedInterests.has(interest)) this.selectedInterests.delete(interest);
                else this.selectedInterests.add(interest);
                this.render();
            });
            container.appendChild(button);
        });
    }

    bindEvents() {
        this.bindSingleChoice("#deadlineGroup", "selectedDeadline");
        this.bindSingleChoice("#frequencyGroup", "selectedFrequency");

        this.querySelector("#editPurposeButton")?.addEventListener("click", () => {
            state.updateProfile({ onboardingProgress: { step: 2, paused: false, updatedAt: new Date().toISOString() } });
            storage.save();
            router.navigate("onboarding");
        });

        this.querySelector("#discoverInterestsButton")?.addEventListener("click", () => {
            const active = this.selectedInterests.has(DISCOVER_INTERESTS);
            this.selectedInterests.clear();
            if (!active) this.selectedInterests.add(DISCOVER_INTERESTS);
            this.render();
        });

        const input = this.querySelector("#customTagInput");
        const add = () => {
            const value = input.value.trim().replace(/\s+/g, " ");
            if (!value) return;
            const existing = this.availableInterests.find(
                (item) => item.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR")
            );
            const interest = existing || value;
            if (!existing) this.availableInterests.push(interest);
            this.selectedInterests.delete(DISCOVER_INTERESTS);
            this.selectedInterests.add(interest);
            input.value = "";
            this.render();
        };
        this.querySelector("#addTagButton")?.addEventListener("click", add);
        input?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                add();
            }
        });
        this.querySelector("#goalsBackButton")?.addEventListener("click", () => {
            state.updateProfile({
                onboardingProgress: {
                    step: 5,
                    paused: false,
                    updatedAt: new Date().toISOString()
                }
            });
            storage.save();
            router.navigate("onboarding");
        });
        this.querySelector("#goalsNextButton")?.addEventListener("click", () => this.saveAndContinue());
    }

    bindSingleChoice(selector, property) {
        const controls = [...this.querySelectorAll(`${selector} .quick-reply`)];
        controls.forEach((control) => {
            const selected = control.dataset.val === this[property];
            control.classList.toggle("selected", selected);
            control.setAttribute("aria-pressed", String(selected));
            control.addEventListener("click", () => {
                this[property] = control.dataset.val;
                controls.forEach((item) => {
                    const active = item === control;
                    item.classList.toggle("selected", active);
                    item.setAttribute("aria-pressed", String(active));
                });
            });
        });
    }

    saveAndContinue() {
        if (!this.selectedDeadline) return this.showToast("Selecione um prazo ou marque que não há prazo fixo.");
        if (!this.selectedFrequency) return this.showToast("Escolha quantos dias por semana pretende estudar.");
        if (this.selectedInterests.size === 0) return this.showToast("Escolha ao menos um assunto ou a opção de descobrir depois.");

        state.updateProfile({
            goalDetails: {
                ...(state.profile.goalDetails || {}),
                deadline: this.selectedDeadline,
                frequency: this.selectedFrequency,
                interests: [...this.selectedInterests]
            }
        });
        storage.save();
        router.navigate("level-test");
    }

    showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2200);
    }
}

if (!customElements.get("ef-goals")) customElements.define("ef-goals", EFGoals);
