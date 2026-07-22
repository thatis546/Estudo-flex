import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state, createEmptyDiagnosticResult } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import {
    CONTACT_OPTIONS,
    DAILY_MINUTES_OPTIONS,
    LEARNING_STYLE_OPTIONS,
    ONBOARDING_FLOW,
    ONBOARDING_TUTORIAL_STEPS,
    PURPOSE_OPTIONS,
    SUPPORT_OPTIONS,
    buildPurposeProfile,
    getOnboardingOption
} from "../../data/onboarding.js";

const QUESTIONS = Object.freeze({
    language: "Qual idioma você quer aprender primeiro?",
    supportMode: "Como você prefere receber apoio durante as atividades?",
    goal: "Para que você quer usar esta língua primeiro?",
    contact: "Qual frase descreve melhor seu contato atual com esta língua?",
    dailyMinutes: "Quanto tempo cabe de verdade na sua rotina diária?",
    learningStyle: "Como você acredita que aprende melhor?"
});

class EFOnboarding extends HTMLElement {
    constructor() {
        super();
        this.chatStep = 0;
        this.tutorialStep = 0;
        this.sessionToken = 0;
        this.pendingAnswer = null;
    }

    connectedCallback() {}

    onRouteEnter() {
        if (!state.profile?.name) {
            router.navigate("welcome", "replace");
            return;
        }
        this.chatStep = this.findFirstIncompleteStep();
        this.pendingAnswer = null;
        if (!state.profile.onboardingTutorialSeen) {
            this.tutorialStep = 0;
            this.renderTutorial();
            return;
        }
        this.startChat(++this.sessionToken);
    }

    findFirstIncompleteStep() {
        const firstMissing = ONBOARDING_FLOW.findIndex((key) => {
            const value = state.profile[key];
            return key === "dailyMinutes" ? Number(value) <= 0 : !String(value ?? "").trim();
        });
        if (firstMissing >= 0) return firstMissing;
        const storedStep = Number(state.profile.onboardingProgress?.step);
        return Number.isInteger(storedStep)
            ? Math.min(storedStep, ONBOARDING_FLOW.length)
            : ONBOARDING_FLOW.length;
    }

    renderTutorial() {
        const step = ONBOARDING_TUTORIAL_STEPS[this.tutorialStep];
        const last = this.tutorialStep === ONBOARDING_TUTORIAL_STEPS.length - 1;
        this.innerHTML = `
            <section class="onboarding-tutorial" aria-labelledby="tutorialTitle">
                <div class="onboarding-tutorial__topbar">
                    <p class="eyebrow">COMO FUNCIONA</p>
                    <button id="skipTutorial" type="button" class="text-button">Pular passo a passo</button>
                </div>
                <article class="card onboarding-tutorial__card">
                    <span class="onboarding-tutorial__icon" aria-hidden="true">${step.icon}</span>
                    <p class="onboarding-tutorial__counter">${this.tutorialStep + 1} de ${ONBOARDING_TUTORIAL_STEPS.length}</p>
                    <h1 id="tutorialTitle">${step.title}</h1>
                    <p>${step.description}</p>
                    <div class="onboarding-tutorial__example" aria-hidden="true">
                        <span class="quick-reply selected">Exemplo de resposta</span>
                        <span class="primary compact">Confirmar resposta</span>
                    </div>
                </article>
                <div class="onboarding-tutorial__dots" aria-hidden="true">
                    ${ONBOARDING_TUTORIAL_STEPS.map((_, index) => `<span class="${index === this.tutorialStep ? "is-active" : ""}"></span>`).join("")}
                </div>
                <button id="nextTutorial" type="button" class="primary full">${last ? "Começar configuração" : "Próximo"}</button>
            </section>
        `;
        this.querySelector("#skipTutorial")?.addEventListener("click", () => this.finishTutorial());
        this.querySelector("#nextTutorial")?.addEventListener("click", () => {
            if (last) this.finishTutorial();
            else {
                this.tutorialStep += 1;
                this.renderTutorial();
            }
        });
    }

    finishTutorial() {
        state.updateProfile({ onboardingTutorialSeen: true });
        storage.save();
        this.startChat(++this.sessionToken);
    }

    wait(ms, token) {
        return new Promise((resolve) => {
            window.setTimeout(() => resolve(token === this.sessionToken), ms);
        });
    }

    async startChat(token) {
        this.pendingAnswer = null;
        this.innerHTML = `
            <section class="onboarding-chat-shell" aria-labelledby="onboardingChatTitle">
                <header class="onboarding-chat-header">
                    <button id="backButton" type="button" class="back-button" aria-label="Voltar para a pergunta anterior">←</button>
                    <div>
                        <p class="eyebrow">CONVERSA INICIAL</p>
                        <h1 id="onboardingChatTitle">Estudo Flex</h1>
                    </div>
                    <button id="helpButton" type="button" class="text-button compact" aria-label="Ver novamente o passo a passo">Ajuda</button>
                </header>
                <div class="progress-track" aria-label="Progresso da configuração"><span id="chatProgress"></span></div>
                <div class="onboarding-chat-scroll" tabindex="0">
                    <div id="chatLog" class="chat-log onboarding-chat-log" aria-live="polite"></div>
                    <div id="quickReplies" class="onboarding-option-grid" aria-label="Opções de resposta"></div>
                    <div id="selectionReview" class="onboarding-selection-review" hidden>
                        <small>Resposta selecionada</small>
                        <strong id="selectionLabel"></strong>
                        <p>Confira a opção antes de enviar. Você ainda pode escolher outra.</p>
                        <button id="confirmAnswer" type="button" class="primary full">Confirmar resposta</button>
                    </div>
                </div>
                <footer class="onboarding-chat-footer">
                    <button id="pauseButton" type="button" class="secondary full">Continuar depois pela Home</button>
                </footer>
            </section>
        `;

        this.querySelector("#backButton")?.addEventListener("click", () => this.goBack());
        this.querySelector("#pauseButton")?.addEventListener("click", () => this.pause());
        this.querySelector("#helpButton")?.addEventListener("click", () => {
            this.tutorialStep = 0;
            this.renderTutorial();
        });
        this.querySelector("#confirmAnswer")?.addEventListener("click", () => this.confirmPendingAnswer());

        const userName = state.profile.name || "estudante";
        if (this.chatStep === 0) {
            this.addMessage(`Olá, ${userName}! 😊`, "ai");
            if (!(await this.wait(250, token))) return;
            this.addMessage("Você escolherá uma opção por vez e confirmará antes de enviá-la.", "ai");
        } else {
            this.addMessage(`Bem-vindo de volta, ${userName}! Sua configuração está salva.`, "ai");
        }
        if (!(await this.wait(180, token))) return;
        this.ask();
    }

    ask() {
        if (this.chatStep >= ONBOARDING_FLOW.length) {
            state.updateProfile({
                onboardingProgress: {
                    step: ONBOARDING_FLOW.length,
                    paused: false,
                    updatedAt: new Date().toISOString()
                }
            });
            storage.save();
            this.addMessage("Ótimo! Agora escolha prazo, frequência e assuntos que devem aparecer nas atividades.", "ai");
            window.setTimeout(() => router.navigate("goals"), 500);
            return;
        }

        const key = ONBOARDING_FLOW[this.chatStep];
        const progressBar = this.querySelector("#chatProgress");
        if (progressBar) progressBar.style.width = `${((this.chatStep + 1) / ONBOARDING_FLOW.length) * 100}%`;
        this.pendingAnswer = null;
        this.updateSelectionReview();

        const language = EF_LANGUAGES[state.profile.language];
        const title = this.querySelector("#onboardingChatTitle");
        if (title) title.textContent = key === "language" ? "Estudo Flex" : language?.mentor || "Estudo Flex";
        this.addMessage(QUESTIONS[key], "ai");
        this.renderOptions(key);
    }

    optionsFor(key) {
        if (key === "language") {
            return Object.entries(EF_LANGUAGES).map(([value, language]) => ({
                value,
                label: `${language.flag || "🌍"} ${language.name}`
            }));
        }
        if (key === "supportMode") return SUPPORT_OPTIONS;
        if (key === "goal") return PURPOSE_OPTIONS;
        if (key === "contact") return CONTACT_OPTIONS;
        if (key === "dailyMinutes") return DAILY_MINUTES_OPTIONS;
        if (key === "learningStyle") return LEARNING_STYLE_OPTIONS;
        return [];
    }

    renderOptions(key) {
        const box = this.querySelector("#quickReplies");
        if (!box) return;
        box.innerHTML = "";
        this.optionsFor(key).forEach((option) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "quick-reply onboarding-option";
            button.dataset.value = String(option.value);
            button.textContent = option.label;
            button.addEventListener("click", () => this.selectPendingAnswer(option, button));
            box.appendChild(button);
        });
    }

    selectPendingAnswer(option, button) {
        this.pendingAnswer = { value: option.value, label: option.label };
        this.querySelectorAll(".onboarding-option").forEach((item) => {
            const selected = item === button;
            item.classList.toggle("selected", selected);
            item.setAttribute("aria-pressed", String(selected));
        });
        this.updateSelectionReview();
        this.querySelector("#confirmAnswer")?.focus({ preventScroll: true });
    }

    updateSelectionReview() {
        const review = this.querySelector("#selectionReview");
        const label = this.querySelector("#selectionLabel");
        if (!review || !label) return;
        review.hidden = !this.pendingAnswer;
        label.textContent = this.pendingAnswer?.label || "";
        if (this.pendingAnswer) review.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    confirmPendingAnswer() {
        if (!this.pendingAnswer) {
            this.showToast("Escolha uma opção antes de confirmar.");
            return;
        }
        this.commitAnswer(this.pendingAnswer.value, this.pendingAnswer.label);
    }

    commitAnswer(value, display) {
        const key = ONBOARDING_FLOW[this.chatStep];
        if (!key) return;
        const validOption = this.optionsFor(key).some((item) => String(item.value) === String(value));
        if (!validOption) {
            this.showToast("A opção selecionada não é válida.");
            return;
        }

        this.addMessage(display, "user");
        const previousLanguage = state.profile.language;
        let patch = { [key]: key === "dailyMinutes" ? Number(value) : value };
        if (key === "goal") patch = { ...patch, ...buildPurposeProfile(value) };
        state.updateProfile(patch);

        if (key === "language") {
            if (previousLanguage && previousLanguage !== value && !state.profile.onboardingComplete) {
                state.languages = state.languages.filter((item) => item.code !== previousLanguage);
            }
            const language = EF_LANGUAGES[value];
            state.setCurrentLanguage(value);
            const existingLanguage = state.getLanguage(value);
            state.addLanguage({
                code: value,
                name: language.name,
                flag: language.flag || "🌍",
                country: language.country || "",
                mentor: language.mentor || "",
                journeyId: existingLanguage?.journeyId || "",
                journeyLabel: existingLanguage?.journeyLabel || "",
                setupComplete: Boolean(existingLanguage?.setupComplete),
                setupStatus: existingLanguage?.setupStatus || "setup-required",
                learningProfile: existingLanguage?.learningProfile,
                diagnosticResult: existingLanguage?.diagnosticResult,
                diagnosticAnswers: existingLanguage?.diagnosticAnswers || [],
                diagnosticProgress: existingLanguage?.diagnosticProgress,
                dailyPlan: existingLanguage?.dailyPlan,
                reviewQueue: existingLanguage?.reviewQueue || [],
                professional: existingLanguage?.professional,
                communicationLab: existingLanguage?.communicationLab,
                xp: existingLanguage?.xp || 0,
                progress: existingLanguage?.progress || 0,
                stats: existingLanguage?.stats || {}
            });
        }

        this.chatStep += 1;
        state.updateProfile({
            onboardingProgress: {
                step: this.chatStep,
                paused: false,
                updatedAt: new Date().toISOString()
            }
        });
        storage.save();
        window.setTimeout(() => this.ask(), 220);
    }

    addMessage(text, type) {
        const chatLog = this.querySelector("#chatLog");
        if (!chatLog) return;
        const message = document.createElement("div");
        message.className = `message ${type}`;
        message.textContent = text;
        chatLog.appendChild(message);
        const scroll = this.querySelector(".onboarding-chat-scroll");
        requestAnimationFrame(() => {
            if (scroll) scroll.scrollTop = scroll.scrollHeight;
        });
    }

    goBack() {
        if (this.chatStep <= 0) {
            router.navigate("welcome");
            return;
        }
        const previousStep = this.chatStep - 1;
        const previousKey = ONBOARDING_FLOW[previousStep];
        const patch = {
            [previousKey]: previousKey === "dailyMinutes" ? 0 : "",
            onboardingProgress: {
                step: previousStep,
                paused: false,
                updatedAt: new Date().toISOString()
            }
        };
        if (previousKey === "goal") {
            Object.assign(patch, { goalDescription: "", useCase: "", lifeContext: "" });
        }
        state.updateProfile(patch);
        if (previousKey === "language") {
            const languageToRemove = state.currentLanguage || state.profile.language;
            if (languageToRemove && !state.profile.onboardingComplete) {
                state.languages = state.languages.filter((item) => item.code !== languageToRemove);
            }
            state.setCurrentLanguage("");
            state.updateProfile({
                journeyId: "",
                journeyLabel: "",
                level: 0,
                levelTag: "",
                diagnosticScore: 0,
                diagnosticAnswers: [],
                diagnosticProgress: { step: 0, answers: [], scores: [], questionIds: [] },
                levelResult: createEmptyDiagnosticResult()
            });
        }
        storage.save();
        this.chatStep = previousStep;
        this.startChat(++this.sessionToken);
    }

    pause() {
        this.sessionToken += 1;
        state.updateProfile({
            onboardingProgress: {
                step: this.chatStep,
                paused: true,
                updatedAt: new Date().toISOString()
            }
        });
        storage.save();
        router.navigate("home");
    }

    showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2200);
    }
}

if (!customElements.get("ef-onboarding")) customElements.define("ef-onboarding", EFOnboarding);
