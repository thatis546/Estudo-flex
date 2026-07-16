import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state } from "../../core/state.js";

const DEFAULT_INTERESTS = [
    "Filmes", "Música", "Tecnologia", "Engenharia",
    "Negócios", "Viagens", "Esportes", "Gastronomia"
];

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
        this.selectedInterests = new Set(Array.isArray(saved.interests) ? saved.interests.filter(Boolean) : []);
        this.availableInterests = Array.from(new Set([...DEFAULT_INTERESTS, ...this.selectedInterests]));
        this.render();
    }

    render() {
        this.innerHTML = `
            <div class="screen-header">
                <p class="eyebrow">PASSO 2 DE 3</p>
                <h1>Para que esta língua fará parte da sua vida?</h1>
                <p>O objetivo precisa ser específico para este idioma. Outros idiomas terão suas próprias respostas.</p>
            </div>
            <article class="card">
                <div class="goals-body">
                    <div class="form-field">
                        <label for="goalDescription">Explique por que você quer aprender esta língua</label>
                        <textarea id="goalDescription" rows="4" maxlength="500" placeholder="Ex.: quero estudar engenharia na França e conseguir acompanhar aulas, projetos e conversas com colegas."></textarea>
                        <small>Quanto mais concreto, melhor será a adaptação do plano.</small>
                    </div>
                    <div class="form-field">
                        <label for="useCase">Em qual situação real você pretende usá-la?</label>
                        <textarea id="useCase" rows="4" maxlength="500" placeholder="Ex.: universidade, reuniões de trabalho, viagens, conversar com familiares ou morar no exterior."></textarea>
                    </div>
                    <fieldset class="mentor-section">
                        <legend class="slider-label">Qual é o seu prazo ideal?</legend>
                        <div id="deadlineGroup" class="quick-replies">
                            ${this.optionButton("no-deadline", "Sem prazo fixo")}
                            ${this.optionButton("3-months", "3 meses")}
                            ${this.optionButton("6-months", "6 meses")}
                            ${this.optionButton("1-year", "1 ano")}
                        </div>
                    </fieldset>
                    <fieldset class="mentor-section">
                        <legend class="slider-label">Frequência ideal de estudo</legend>
                        <div id="frequencyGroup" class="quick-replies">
                            ${this.optionButton("3x", "3x por semana")}
                            ${this.optionButton("5x", "5x por semana")}
                            ${this.optionButton("daily", "Todos os dias")}
                        </div>
                    </fieldset>
                    <fieldset class="mentor-section">
                        <legend class="slider-label">Assuntos do seu interesse para esta língua</legend>
                        <p class="small-text goals-helper">Eles serão usados em exemplos, exercícios, revisões e conversas com o Mentor.</p>
                        <div id="interestsGroup" class="tag-list"></div>
                        <div class="tag-editor">
                            <label class="sr-only" for="customTagInput">Adicionar outro assunto</label>
                            <input id="customTagInput" type="text" maxlength="40" placeholder="Adicionar outro assunto...">
                            <button id="addTagButton" type="button" class="secondary compact">Adicionar</button>
                        </div>
                    </fieldset>
                </div>
            </article>
            <div class="actions">
                <button id="goalsNextButton" type="button" class="primary full">Avançar para o diagnóstico</button>
            </div>
        `;

        this.querySelector("#goalDescription").value = state.profile.goalDescription || "";
        this.querySelector("#useCase").value = state.profile.useCase || "";
        this.renderInterests();
        this.bindEvents();
    }

    optionButton(value, label) {
        return `<button type="button" class="quick-reply" data-val="${value}">${label}</button>`;
    }

    renderInterests() {
        const container = this.querySelector("#interestsGroup");
        container.innerHTML = "";
        this.availableInterests.forEach((interest) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "tag";
            button.textContent = interest;
            button.classList.toggle("selected", this.selectedInterests.has(interest));
            button.setAttribute("aria-pressed", String(this.selectedInterests.has(interest)));
            button.addEventListener("click", () => {
                if (this.selectedInterests.has(interest)) this.selectedInterests.delete(interest);
                else this.selectedInterests.add(interest);
                this.renderInterests();
            });
            container.appendChild(button);
        });
    }

    bindEvents() {
        this.bindSingleChoice("#deadlineGroup", "selectedDeadline");
        this.bindSingleChoice("#frequencyGroup", "selectedFrequency");
        const input = this.querySelector("#customTagInput");
        const add = () => {
            const value = input.value.trim().replace(/\s+/g, " ");
            if (!value) return;
            const existing = this.availableInterests.find(
                (item) => item.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR")
            );
            const interest = existing || value;
            if (!existing) this.availableInterests.push(interest);
            this.selectedInterests.add(interest);
            input.value = "";
            this.renderInterests();
        };
        this.querySelector("#addTagButton").addEventListener("click", add);
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                add();
            }
        });
        this.querySelector("#goalsNextButton").addEventListener("click", () => this.saveAndContinue());
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
        const goalDescription = this.querySelector("#goalDescription").value.trim();
        const useCase = this.querySelector("#useCase").value.trim();
        if (goalDescription.length < 12) return this.showToast("Explique um pouco melhor por que quer aprender esta língua.");
        if (useCase.length < 8) return this.showToast("Informe ao menos uma situação real de uso.");
        if (!this.selectedDeadline) return this.showToast("Selecione um prazo ideal.");
        if (!this.selectedFrequency) return this.showToast("Escolha a frequência de estudos.");
        if (this.selectedInterests.size === 0) return this.showToast("Selecione ao menos um assunto.");

        state.updateProfile({
            goalDescription,
            useCase,
            goalDetails: {
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
