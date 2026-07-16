import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { state } from "../../core/state.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { evaluateShortDiagnostic } from "../../core/diagnostic.js";

class EFLevelTest extends HTMLElement {
    constructor() {
        super();
        this.step = 0;
        this.answers = [];
        this.scores = [];
        this.currentDifficulty = 3;
        this.processing = false;
    }

    connectedCallback() {}

    onRouteEnter() {
        const profile = state.profile;
        if (!profile?.language || !EF_LANGUAGES[profile.language]) {
            router.navigate("onboarding", "replace");
            return;
        }

        if (profile.levelResult?.completedAt) {
            router.navigate("finish", "replace");
            return;
        }

        this.profile = profile;
        this.language = EF_LANGUAGES[profile.language];
        this.diagnosticData = this.language.diagnostic || [];

        const progress = profile.diagnosticProgress || {};
        this.step = Math.max(0, Number(progress.step) || 0);
        this.answers = Array.isArray(progress.answers) ? [...progress.answers] : [];
        this.scores = Array.isArray(progress.scores) ? [...progress.scores] : [];
        this.currentDifficulty = Math.min(5, Math.max(1, Number(progress.currentDifficulty) || 3));

        if (this.step >= this.getTotalSteps()) {
            this.finish();
            return;
        }
        this.render();
    }

    getTotalSteps() {
        if (Array.isArray(this.diagnosticData)) return this.diagnosticData.length;
        const pools = Object.values(this.diagnosticData || {}).filter(Array.isArray);
        return Math.max(0, ...pools.map((pool) => pool.length));
    }

    getCurrentQuestion() {
        if (Array.isArray(this.diagnosticData)) {
            const matchingDifficulty = this.diagnosticData.filter(
                (question) => Number(question.difficulty) === this.currentDifficulty
            );
            if (matchingDifficulty.length) return matchingDifficulty[this.step % matchingDifficulty.length];
            return this.diagnosticData[this.step] || null;
        }

        const pool = this.diagnosticData?.[this.currentDifficulty];
        return Array.isArray(pool) ? pool[this.step] || pool[pool.length - 1] || null : null;
    }

    render() {
        this.innerHTML = `
            <div class="screen-header">
                <p class="eyebrow">PASSO 3 DE 3</p>
                <h1>Avaliação de nível (${this.language.name})</h1>
            </div>
            <div class="progress-track" aria-label="Progresso do teste"><span id="testProgress"></span></div>
            <article class="card"><div id="questionArea" class="diagnostic-body"></div></article>
            <div class="actions"><button id="levelTestNextButton" type="button" class="primary full">Continuar</button></div>
        `;
        this.renderQuestion();
        this.querySelector("#levelTestNextButton").addEventListener("click", () => this.next());
    }

    renderQuestion() {
        const area = this.querySelector("#questionArea");
        const question = this.getCurrentQuestion();
        if (!question) {
            this.finish();
            return;
        }

        area.innerHTML = "";
        const totalSteps = Math.max(1, this.getTotalSteps());
        this.querySelector("#testProgress").style.width = `${Math.min(100, ((this.step + 1) / totalSteps) * 100)}%`;

        const title = document.createElement("h2");
        title.className = "question-title";
        title.textContent = question.prompt || "Responda à questão.";
        area.appendChild(title);

        if (question.type === "choice" && Array.isArray(question.options)) {
            const replies = document.createElement("div");
            replies.className = "quick-replies";
            question.options.forEach(([text, points]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "quick-reply";
                button.textContent = text;
                const selected = this.answers[this.step] === text;
                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
                button.addEventListener("click", () => {
                    replies.querySelectorAll(".quick-reply").forEach((item) => {
                        item.classList.toggle("selected", item === button);
                        item.setAttribute("aria-pressed", String(item === button));
                    });
                    this.answers[this.step] = text;
                    this.scores[this.step] = Number(points) || 0;
                    this.saveIntermediateProgress();
                });
                replies.appendChild(button);
            });
            area.appendChild(replies);
        } else if (question.type === "text") {
            const textarea = document.createElement("textarea");
            textarea.rows = 5;
            textarea.maxLength = 1000;
            textarea.placeholder = "Escreva sua resposta aqui...";
            textarea.className = "text-input";
            textarea.setAttribute("aria-label", question.prompt || "Resposta escrita do diagnóstico");
            textarea.value = this.answers[this.step] || "";
            textarea.addEventListener("input", () => {
                const value = textarea.value.trim();
                const words = value.split(/\s+/).filter(Boolean).length;
                this.answers[this.step] = value;
                this.scores[this.step] = words >= 8 ? 3 : words >= 4 ? 2 : words > 0 ? 1 : 0;
                this.saveIntermediateProgress();
            });
            area.appendChild(textarea);
        } else {
            const message = document.createElement("p");
            message.textContent = "Esta questão está com uma configuração inválida.";
            area.appendChild(message);
            this.querySelector("#levelTestNextButton").disabled = true;
        }

        this.processing = false;
    }

    saveIntermediateProgress(nextStep = this.step) {
        state.updateProfile({
            diagnosticProgress: {
                step: nextStep,
                answers: [...this.answers],
                scores: [...this.scores],
                currentDifficulty: this.currentDifficulty
            }
        });
        storage.save();
    }

    next() {
        if (this.processing) return;
        if (!String(this.answers[this.step] ?? "").trim()) {
            this.showToast("Responda à questão antes de continuar.");
            return;
        }

        this.processing = true;
        const lastScore = Number(this.scores[this.step]) || 0;
        if (lastScore >= 3) this.currentDifficulty = Math.min(5, this.currentDifficulty + 1);
        else if (lastScore <= 1) this.currentDifficulty = Math.max(1, this.currentDifficulty - 1);

        this.step += 1;
        this.saveIntermediateProgress(this.step);
        if (this.step >= this.getTotalSteps()) this.finish();
        else this.renderQuestion();
    }

    finish() {
        if (this.profile?.levelResult?.completedAt) {
            router.navigate("finish");
            return;
        }

        const evaluation = evaluateShortDiagnostic(
            this.scores,
            this.getTotalSteps()
        );
        const {
            totalScore,
            level,
            levelTag,
            confidence,
            strengths,
            weaknesses
        } = evaluation;

        state.updateProfile({
            diagnosticScore: totalScore,
            diagnosticAnswers: [...this.answers],
            level,
            levelTag,
            levelResult: {
                cefr: levelTag,
                score: totalScore,
                confidence,
                strengths,
                weaknesses,
                completedAt: new Date().toISOString()
            },
            diagnosticProgress: {
                step: 0,
                answers: [],
                scores: [],
                currentDifficulty: 3
            }
        });

        const languageRecord = state.getLanguage(state.profile.language);
        if (languageRecord) {
            languageRecord.level = levelTag;
            languageRecord.diagnosticScore = totalScore;
            languageRecord.diagnosticAnswers = [...this.answers];
            languageRecord.levelResult = {
                ...state.profile.levelResult,
                strengths: [...state.profile.levelResult.strengths],
                weaknesses: [...state.profile.levelResult.weaknesses]
            };
        }
        storage.save();
        router.navigate("finish");
    }

    showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2200);
    }
}

if (!customElements.get("ef-level-test")) customElements.define("ef-level-test", EFLevelTest);
