import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state, createEmptyDiagnosticResult } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";

const FLOW = [
    "language",
    "supportMode",
    "goal",
    "contact",
    "dailyMinutes",
    "lifeContext",
    "learningStyle"
];

const SUPPORT_OPTIONS = [
    ["pt", "Quero tudo explicado em português"],
    ["guided", "Quero frases curtas no idioma com tradução rápida"],
    ["immersive", "Pode usar mais o idioma e me ajudar quando eu travar"]
];

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

class EFOnboarding extends HTMLElement {
    constructor() {
        super();
        this.chatStep = 0;
        this.sessionToken = 0;
    }

    connectedCallback() {}

    onRouteEnter() {
        if (!state.profile?.name) {
            router.navigate("welcome", "replace");
            return;
        }

        this.chatStep = this.findFirstIncompleteStep();
        this.startChat(++this.sessionToken);
    }

    findFirstIncompleteStep() {
        const storedStep = Number(state.profile.onboardingProgress?.step);
        const firstMissing = FLOW.findIndex((key) => {
            const value = state.profile[key];
            return key === "dailyMinutes" ? Number(value) <= 0 : !String(value ?? "").trim();
        });
        if (firstMissing >= 0) return firstMissing;
        return Number.isInteger(storedStep) ? Math.min(storedStep, FLOW.length) : FLOW.length;
    }

    wait(ms, token) {
        return new Promise((resolve) => {
            window.setTimeout(() => resolve(token === this.sessionToken), ms);
        });
    }

    async startChat(token) {
        this.innerHTML = `
            <div class="screen-header">
                <button id="backButton" type="button" class="back-button" aria-label="Voltar">←</button>
                <div>
                    <p class="eyebrow">CONVERSA INICIAL</p>
                    <h2 id="chatMentorName">Estudo Flex</h2>
                </div>
            </div>
            <div class="progress-track" aria-label="Progresso da configuração"><span id="chatProgress"></span></div>
            <div id="chatLog" class="chat-log" aria-live="polite"></div>
            <div id="quickReplies" class="quick-replies"></div>
            <div class="composer">
                <input id="chatInput" aria-label="Resposta para a pergunta atual" placeholder="Ou responda com suas palavras" autocomplete="off">
                <button id="sendButton" type="button" class="primary compact">Enviar</button>
            </div>
            <button id="pauseButton" type="button" class="text-button full">Continuar depois</button>
        `;

        this.querySelector("#backButton").addEventListener("click", () => this.goBack());
        this.querySelector("#pauseButton").addEventListener("click", () => this.pause());
        this.querySelector("#sendButton").addEventListener("click", () => this.sendText());
        this.querySelector("#chatInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.sendText();
            }
        });

        const userName = state.profile.name || "estudante";
        if (this.chatStep === 0) {
            this.addMessage(`Olá, ${userName}! 😊`, "ai");
            if (!(await this.wait(350, token))) return;
            this.addMessage("Vou fazer algumas perguntas rápidas para montar seu plano.", "ai");
        } else {
            this.addMessage(`Bem-vindo de volta, ${userName}! Vamos continuar de onde você parou.`, "ai");
        }

        if (!(await this.wait(250, token))) return;
        this.ask();
    }

    ask() {
        if (this.chatStep >= FLOW.length) {
            state.updateProfile({
                onboardingProgress: {
                    step: FLOW.length,
                    paused: false,
                    updatedAt: new Date().toISOString()
                }
            });
            storage.save();
            const language = EF_LANGUAGES[state.profile.language];
            this.addMessage(
                language
                    ? `Ótimo! ${language.mentor} já tem o contexto inicial. Agora vamos definir seus objetivos.`
                    : "Ótimo! Agora vamos definir seus objetivos.",
                "ai"
            );
            window.setTimeout(() => router.navigate("goals"), 650);
            return;
        }

        const key = FLOW[this.chatStep];
        const progressBar = this.querySelector("#chatProgress");
        if (progressBar) progressBar.style.width = `${((this.chatStep + 1) / FLOW.length) * 100}%`;

        if (key === "language") {
            this.querySelector("#chatMentorName").textContent = "Estudo Flex";
            this.addMessage("Qual idioma você quer aprender primeiro?", "ai");
            this.renderLanguages();
            return;
        }

        if (key === "supportMode") {
            this.addMessage("Como você prefere que eu me comunique com você?", "ai");
            this.renderPairs(SUPPORT_OPTIONS);
            return;
        }

        const language = EF_LANGUAGES[state.profile.language];
        if (!language) {
            this.showToast("O idioma salvo não é válido. Escolha novamente.");
            state.updateProfile({ language: "" });
            state.currentLanguage = "";
            this.chatStep = 0;
            storage.save();
            this.startChat(++this.sessionToken);
            return;
        }

        this.querySelector("#chatMentorName").textContent = language.mentor;
        this.addMessage(this.getQuestion(language, key), "ai");
        this.renderLocalized(language, key);
    }

    getQuestion(language, key) {
        const supportMode = state.profile.supportMode;
        const target = language.questions?.[key] || language.ptQuestions?.[key] || "Conte um pouco mais.";
        const translated = language.ptQuestions?.[key] || target;
        if (supportMode === "pt") return translated;
        if (supportMode === "guided") return `${target}\n(${translated})`;
        return target;
    }

    answer(value, display = value) {
        const key = FLOW[this.chatStep];
        if (!key) return;

        let normalizedValue = value;
        if (key === "dailyMinutes") {
            const minutes = Number(String(value).match(/\d+/)?.[0]);
            if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) {
                this.showToast("Informe um tempo entre 5 e 240 minutos.");
                return;
            }
            normalizedValue = minutes;
        }

        if (key === "language" && !EF_LANGUAGES[normalizedValue]) {
            this.showToast("Escolha um dos idiomas disponíveis.");
            return;
        }

        if (key === "supportMode" && !SUPPORT_OPTIONS.some(([code]) => code === normalizedValue)) {
            this.showToast("Escolha um dos modos de apoio disponíveis.");
            return;
        }

        this.addMessage(display, "user");
        this.querySelector("#quickReplies").innerHTML = "";

        const previousLanguage = state.profile.language;
        state.updateProfile({ [key]: normalizedValue });

        if (key === "language") {
            if (previousLanguage && previousLanguage !== normalizedValue && !state.profile.onboardingComplete) {
                state.languages = state.languages.filter((item) => item.code !== previousLanguage);
            }
            const language = EF_LANGUAGES[normalizedValue];
            state.setCurrentLanguage(normalizedValue);
            const existingLanguage = state.getLanguage(normalizedValue);
            state.addLanguage({
                code: normalizedValue,
                name: language.name,
                flag: language.flag || "🌍",
                mentor: language.mentor || "",
                level: existingLanguage?.level || "",
                setupComplete: Boolean(existingLanguage?.setupComplete),
                setupStatus: existingLanguage?.setupStatus || "setup-required",
                xp: existingLanguage?.xp || 0,
                progress: existingLanguage?.progress || 0,
                diagnosticScore: existingLanguage?.diagnosticScore || 0,
                diagnosticAnswers: existingLanguage?.diagnosticAnswers || [],
                levelResult: existingLanguage?.levelResult,
                stats: existingLanguage?.stats || {}
            });
            window.dispatchEvent(new CustomEvent("language-changed", {
                detail: { code: normalizedValue, language }
            }));
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
        window.setTimeout(() => this.ask(), 250);
    }

    renderLanguages() {
        this.renderPairs(
            Object.entries(EF_LANGUAGES).map(([code, language]) => [code, language.name])
        );
    }

    renderLocalized(language, key) {
        const targetOptions = Array.isArray(language.options?.[key]) ? language.options[key] : [];
        const translatedOptions = Array.isArray(language.ptOptions?.[key]) ? language.ptOptions[key] : [];
        const supportMode = state.profile.supportMode;
        const items = targetOptions.map((value, index) => {
            const translated = translatedOptions[index] || value;
            const display = supportMode === "pt"
                ? translated
                : supportMode === "guided"
                    ? `${value} (${translated})`
                    : value;
            return [value, display];
        });
        this.renderPairs(items);
    }

    renderPairs(items) {
        const box = this.querySelector("#quickReplies");
        if (!box) return;
        box.innerHTML = "";
        items.forEach(([value, display]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "quick-reply";
            button.textContent = display;
            button.addEventListener("click", () => this.answer(value, display));
            box.appendChild(button);
        });
    }

    sendText() {
        const input = this.querySelector("#chatInput");
        const text = input?.value.trim();
        if (!text) return;

        const key = FLOW[this.chatStep];
        if (key === "language") {
            const normalized = normalizeText(text);
            const match = Object.entries(EF_LANGUAGES).find(([code, language]) =>
                normalizeText(code) === normalized || normalizeText(language.name) === normalized
            );
            if (!match) {
                this.showToast("Digite ou selecione um dos idiomas disponíveis.");
                return;
            }
            this.answer(match[0], match[1].name);
        } else if (key === "supportMode") {
            const normalized = normalizeText(text);
            const match = SUPPORT_OPTIONS.find(([code, label]) =>
                normalizeText(code) === normalized || normalizeText(label).includes(normalized)
            );
            if (!match) {
                this.showToast("Selecione um dos modos de apoio sugeridos.");
                return;
            }
            this.answer(match[0], match[1]);
        } else {
            this.answer(text, text);
        }
        input.value = "";
    }

    addMessage(text, type) {
        const chatLog = this.querySelector("#chatLog");
        if (!chatLog) return;
        const message = document.createElement("div");
        message.className = `message ${type}`;
        message.textContent = text;
        chatLog.appendChild(message);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    goBack() {
        if (this.chatStep <= 0) {
            this.pause();
            return;
        }
        const previousStep = this.chatStep - 1;
        const previousKey = FLOW[previousStep];
        state.updateProfile({
            [previousKey]: previousKey === "dailyMinutes" ? 0 : "",
            onboardingProgress: {
                step: previousStep,
                paused: false,
                updatedAt: new Date().toISOString()
            }
        });
        if (previousKey === "language") {
            const languageToRemove = state.currentLanguage || state.profile.language;
            if (languageToRemove && !state.profile.onboardingComplete) {
                state.languages = state.languages.filter(
                    (item) => item.code !== languageToRemove
                );
            }
            state.setCurrentLanguage("");
            state.updateProfile({
                journeyId: "",
                journeyLabel: "",
                level: 0,
                levelTag: "",
                diagnosticScore: 0,
                diagnosticAnswers: [],
                diagnosticProgress: {
                    step: 0,
                    answers: [],
                    scores: [],
                    questionIds: []
                },
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
        router.navigate("welcome");
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
