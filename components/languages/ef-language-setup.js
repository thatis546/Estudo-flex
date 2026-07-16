import { router } from "../../core/router.js";
import { state } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { getCurrentLanguageRecord, isLanguageReady, saveLanguageSetup } from "../../services/language-profile.service.js";

const INTERESTS = ["Filmes", "Música", "Tecnologia", "Engenharia", "Negócios", "Viagens", "Esportes", "Gastronomia", "Literatura", "Ciência", "Moda", "História"];

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

function option(value, label, selected) {
    return `<option value="${escapeHTML(value)}" ${selected === value ? "selected" : ""}>${escapeHTML(label)}</option>`;
}

export class EFLanguageSetup extends HTMLElement {
    connectedCallback() {}

    onRouteEnter() {
        const record = getCurrentLanguageRecord();
        if (!record || !EF_LANGUAGES[record.code]) {
            router.navigate("languages", "replace");
            return;
        }
        this.record = record;
        this.render();
    }

    render() {
        const language = EF_LANGUAGES[this.record.code];
        const profile = this.record.learningProfile || {};
        const details = profile.goalDetails || {};
        const selectedInterests = new Set(details.interests || []);
        const ready = isLanguageReady(this.record);

        this.innerHTML = `
            <section class="language-setup-page" aria-labelledby="languageSetupTitle">
                <header class="screen-header">
                    <button id="backToLanguages" type="button" class="back-button" aria-label="Voltar">←</button>
                    <div>
                        <p class="eyebrow">PERFIL INDEPENDENTE DO IDIOMA</p>
                        <h1 id="languageSetupTitle">${ready ? "Editar" : "Configurar"} ${escapeHTML(language.name)}</h1>
                        <p>Objetivos, contexto, diagnóstico, revisões e progresso desta língua não serão copiados automaticamente para outras.</p>
                    </div>
                </header>

                <form id="languageSetupForm" class="card language-setup-form">
                    <label>
                        <span class="slider-label">Por que você quer aprender ${escapeHTML(language.name)}?</span>
                        <select id="languageGoal" class="text-input" required>
                            ${option("", "Selecione", profile.goal)}
                            ${option("travel", "Viagens", profile.goal)}
                            ${option("work", "Trabalho", profile.goal)}
                            ${option("study", "Faculdade ou estudos", profile.goal)}
                            ${option("relocation", "Morar em outro país", profile.goal)}
                            ${option("conversation", "Conversar com pessoas", profile.goal)}
                            ${option("exam", "Prova ou certificação", profile.goal)}
                            ${option("culture", "Cultura e entretenimento", profile.goal)}
                        </select>
                    </label>

                    <label>
                        <span class="slider-label">Explique com suas palavras o que deseja alcançar</span>
                        <textarea id="languageGoalDescription" class="text-input" rows="3" maxlength="600" required placeholder="Ex.: quero participar de reuniões com fornecedores alemães sem depender de tradução.">${escapeHTML(profile.goalDescription || "")}</textarea>
                    </label>

                    <label>
                        <span class="slider-label">Em qual situação concreta você pretende usar essa língua?</span>
                        <textarea id="languageUseCase" class="text-input" rows="3" maxlength="600" required placeholder="Ex.: em entrevistas, no aeroporto, na universidade ou conversando com familiares.">${escapeHTML(profile.useCase || "")}</textarea>
                    </label>

                    <label>
                        <span class="slider-label">Contexto principal</span>
                        <select id="languageContext" class="text-input" required>
                            ${option("", "Selecione", profile.lifeContext)}
                            ${option("daily", "Dia a dia", profile.lifeContext)}
                            ${option("work", "Ambiente profissional", profile.lifeContext)}
                            ${option("university", "Universidade", profile.lifeContext)}
                            ${option("travel", "Viagens", profile.lifeContext)}
                            ${option("immigration", "Imigração e burocracias", profile.lifeContext)}
                            ${option("family", "Família e relações pessoais", profile.lifeContext)}
                        </select>
                    </label>

                    <label>
                        <span class="slider-label">Quanto contato você já teve com ${escapeHTML(language.name)}?</span>
                        <select id="languageContact" class="text-input" required>
                            ${option("", "Selecione", profile.contact)}
                            ${option("never", "Nunca estudei", profile.contact)}
                            ${option("basics", "Sei algumas palavras e cumprimentos", profile.contact)}
                            ${option("sometimes", "Já estudei um pouco", profile.contact)}
                            ${option("frequent", "Uso ou estudo com frequência", profile.contact)}
                            ${option("advanced", "Consigo conversar e produzir textos", profile.contact)}
                        </select>
                    </label>

                    <div class="language-setup-grid">
                        <label><span class="slider-label">Tempo por sessão</span><select id="languageMinutes" class="text-input" required>
                            ${option("", "Selecione", String(profile.dailyMinutes || ""))}
                            ${option("10", "10 minutos", String(profile.dailyMinutes || ""))}
                            ${option("20", "20 minutos", String(profile.dailyMinutes || ""))}
                            ${option("30", "30 minutos", String(profile.dailyMinutes || ""))}
                            ${option("45", "45 minutos", String(profile.dailyMinutes || ""))}
                            ${option("60", "1 hora", String(profile.dailyMinutes || ""))}
                        </select></label>
                        <label><span class="slider-label">Frequência desta língua</span><select id="languageFrequency" class="text-input" required>
                            ${option("", "Selecione", details.frequency)}
                            ${option("1x", "1 vez por semana", details.frequency)}
                            ${option("2x", "2 vezes por semana", details.frequency)}
                            ${option("3x", "3 vezes por semana", details.frequency)}
                            ${option("5x", "5 vezes por semana", details.frequency)}
                            ${option("daily", "Todos os dias", details.frequency)}
                        </select></label>
                        <label><span class="slider-label">Prazo</span><select id="languageDeadline" class="text-input" required>
                            ${option("", "Selecione", details.deadline)}
                            ${option("no-deadline", "Sem prazo fixo", details.deadline)}
                            ${option("3-months", "3 meses", details.deadline)}
                            ${option("6-months", "6 meses", details.deadline)}
                            ${option("1-year", "1 ano", details.deadline)}
                            ${option("2-years", "2 anos", details.deadline)}
                        </select></label>
                    </div>

                    <fieldset class="mentor-section">
                        <legend class="slider-label">Interesses usados nos exemplos desta língua</legend>
                        <div id="languageInterests" class="tag-list">
                            ${INTERESTS.map((interest) => `<button type="button" class="tag ${selectedInterests.has(interest) ? "selected" : ""}" data-interest="${escapeHTML(interest)}" aria-pressed="${selectedInterests.has(interest)}">${escapeHTML(interest)}</button>`).join("")}
                        </div>
                        <div class="inline-form-row">
                            <input id="customInterest" class="text-input" maxlength="60" placeholder="Outro interesse">
                            <button id="addCustomInterest" type="button" class="secondary">Adicionar</button>
                        </div>
                    </fieldset>

                    <p class="form-help">${ready ? "Salvar estas mudanças não apaga o diagnóstico atual. Para refazê-lo, use a ação separada na página do idioma." : "Depois desta etapa, o diagnóstico reunirá 12 evidências antes de sugerir uma jornada."}</p>
                    <button id="continueLanguageSetup" type="submit" class="primary full">${ready ? "Salvar alterações" : "Continuar para o diagnóstico"}</button>
                </form>
            </section>
        `;

        this.querySelector("#backToLanguages")?.addEventListener("click", () => router.navigate("languages"));
        this.querySelectorAll("[data-interest]").forEach((button) => this.bindInterestButton(button));
        this.querySelector("#addCustomInterest")?.addEventListener("click", () => this.addCustomInterest());
        this.querySelector("#languageSetupForm")?.addEventListener("submit", (event) => {
            event.preventDefault();
            this.save();
        });
    }

    bindInterestButton(button) {
        button.addEventListener("click", () => {
            const active = !button.classList.contains("selected");
            button.classList.toggle("selected", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }

    addCustomInterest() {
        const input = this.querySelector("#customInterest");
        const value = String(input?.value || "").trim();
        if (!value) return;
        const existing = [...this.querySelectorAll("[data-interest]")].find((item) => item.dataset.interest.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"));
        if (existing) {
            existing.classList.add("selected");
            existing.setAttribute("aria-pressed", "true");
        } else {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "tag selected";
            button.dataset.interest = value;
            button.setAttribute("aria-pressed", "true");
            button.textContent = value;
            this.bindInterestButton(button);
            this.querySelector("#languageInterests")?.appendChild(button);
        }
        input.value = "";
    }

    save() {
        const get = (selector) => this.querySelector(selector)?.value?.trim() || "";
        const goal = get("#languageGoal");
        const goalDescription = get("#languageGoalDescription");
        const useCase = get("#languageUseCase");
        const lifeContext = get("#languageContext");
        const contact = get("#languageContact");
        const dailyMinutes = Number(get("#languageMinutes"));
        const frequency = get("#languageFrequency");
        const deadline = get("#languageDeadline");
        const interests = [...this.querySelectorAll("[data-interest].selected")].map((button) => button.dataset.interest).filter(Boolean);

        if (!goal || goalDescription.length < 8 || useCase.length < 8 || !lifeContext || !contact || !dailyMinutes || !frequency || !deadline) {
            this.showToast("Preencha as informações principais e descreva seu objetivo e situação de uso.");
            return;
        }

        const wasReady = isLanguageReady(this.record);
        saveLanguageSetup({
            goal,
            goalDescription,
            useCase,
            lifeContext,
            contact,
            dailyMinutes,
            learningStyle: this.record.learningProfile?.learningStyle || state.profile?.learningStyle || "",
            goalDetails: { deadline, frequency, interests }
        });
        router.navigate(wasReady ? "languages" : "language-diagnostic");
    }

    showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2600);
    }
}

if (!customElements.get("ef-language-setup")) customElements.define("ef-language-setup", EFLanguageSetup);
