import { DiagnosticSession } from "../../services/diagnostic-session.service.js";
import { EF_LANGUAGES } from "../../data/languages.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character]));

export class EFDiagnosticBase extends HTMLElement {
    constructor() {
        super();
        this.processing = false;
    }

    startDiagnostic(record, { eyebrow = "DIAGNÓSTICO INICIAL", titlePrefix = "Descobrindo sua jornada em", onComplete } = {}) {
        this.record = record;
        this.language = EF_LANGUAGES[record.code] || record;
        this.session = new DiagnosticSession(record);
        this.viewOptions = { eyebrow, titlePrefix, onComplete };
        if (this.session.complete) this.completeDiagnostic();
        else this.renderQuestion();
    }

    renderQuestion() {
        const question = this.session.currentQuestion;
        if (!question) {
            this.completeDiagnostic();
            return;
        }
        this.processing = false;
        const savedAnswer = this.session.answers[this.session.step] || "";
        const isText = question.type === "text";
        this.innerHTML = `
            <section class="language-diagnostic-page" aria-labelledby="diagnosticTitle">
                <header class="screen-header">
                    <p class="eyebrow">${escapeHTML(this.viewOptions.eyebrow)}</p>
                    <h1 id="diagnosticTitle">${escapeHTML(this.viewOptions.titlePrefix)} ${escapeHTML(this.language.name)}</h1>
                    <p>São ${this.session.questions.length} evidências de compreensão, uso e produção. O resultado é uma jornada inicial, não uma certificação.</p>
                </header>
                <div class="progress-track" aria-label="Progresso do diagnóstico"><span style="width:${this.session.progressPercent}%"></span></div>
                <p class="diagnostic-counter">Questão ${this.session.step + 1} de ${this.session.questions.length}</p>
                <article class="card diagnostic-card">
                    <span class="diagnostic-category">${escapeHTML(question.category || "idioma")}</span>
                    <h2>${escapeHTML(question.prompt)}</h2>
                    <div id="diagnosticAnswerArea"></div>
                </article>
                <div class="actions diagnostic-actions">
                    <button id="diagnosticBack" type="button" class="secondary" ${this.session.step === 0 ? "disabled" : ""}>Voltar</button>
                    <button id="diagnosticNext" type="button" class="primary">${this.session.step === this.session.questions.length - 1 ? "Ver resultado" : "Continuar"}</button>
                </div>
            </section>
        `;

        const area = this.querySelector("#diagnosticAnswerArea");
        if (isText) {
            const textarea = document.createElement("textarea");
            textarea.className = "text-input diagnostic-textarea";
            textarea.rows = 6;
            textarea.maxLength = 1800;
            textarea.value = savedAnswer;
            textarea.placeholder = `Responda em ${this.language.name}. Não use tradutor: a resposta incompleta também ajuda o diagnóstico.`;
            textarea.setAttribute("aria-label", question.prompt);
            textarea.addEventListener("input", () => this.session.setAnswer(textarea.value));
            area.appendChild(textarea);
        } else {
            const replies = document.createElement("div");
            replies.className = "quick-replies diagnostic-options";
            (question.options || []).forEach(([label, points]) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "quick-reply";
                button.textContent = label;
                const selected = savedAnswer === label;
                button.classList.toggle("selected", selected);
                button.setAttribute("aria-pressed", String(selected));
                button.addEventListener("click", () => {
                    replies.querySelectorAll("button").forEach((item) => {
                        const active = item === button;
                        item.classList.toggle("selected", active);
                        item.setAttribute("aria-pressed", String(active));
                    });
                    this.session.setAnswer(label, points);
                });
                replies.appendChild(button);
            });
            area.appendChild(replies);
        }

        this.querySelector("#diagnosticBack")?.addEventListener("click", () => {
            this.session.previous();
            this.renderQuestion();
        });
        this.querySelector("#diagnosticNext")?.addEventListener("click", () => this.nextQuestion());
    }

    nextQuestion() {
        if (this.processing) return;
        if (!this.session.canContinue()) {
            this.showToast("Responda à questão antes de continuar.");
            return;
        }
        this.processing = true;
        this.session.next();
        if (this.session.complete) this.completeDiagnostic();
        else this.renderQuestion();
    }

    completeDiagnostic() {
        const result = this.session.finish();
        this.renderResult(result);
    }

    renderResult(result) {
        const strengths = result.strengths.length
            ? result.strengths.map((item) => `<li>${escapeHTML(item)}</li>`).join("")
            : "<li>O diagnóstico ainda reunirá evidências durante as primeiras atividades.</li>";
        const development = result.developmentAreas.length
            ? result.developmentAreas.map((item) => `<li>${escapeHTML(item)}</li>`).join("")
            : "<li>Continue praticando para refinar o Perfil Vivo.</li>";
        this.innerHTML = `
            <section class="language-diagnostic-result">
                <article class="card diagnostic-result-card">
                    <p class="eyebrow">SUA JORNADA INICIAL</p>
                    <h1>${escapeHTML(result.journeyLabel)}</h1>
                    <p>Esse resultado usa ${result.answeredQuestions} respostas e continuará sendo ajustado por evidências reais de estudo e uso do idioma.</p>
                    <div class="profile-stats-grid">
                        <div class="stat-card"><div class="stat-details"><small>Confiança inicial</small><strong>${Math.round(result.confidence * 100)}%</strong></div></div>
                        <div class="stat-card"><div class="stat-details"><small>Evidências respondidas</small><strong>${result.answeredQuestions}/${result.evidence.totalQuestions}</strong></div></div>
                    </div>
                    <div class="diagnostic-result-columns">
                        <div><h2>Pontos observados</h2><ul>${strengths}</ul></div>
                        <div><h2>Próximos focos</h2><ul>${development}</ul></div>
                    </div>
                    <p class="form-help">“Vivendo o idioma” depende de uso real e evolução ao longo do tempo; não é liberado por um único teste.</p>
                    <button id="diagnosticFinish" type="button" class="primary full">Continuar</button>
                </article>
            </section>
        `;
        this.querySelector("#diagnosticFinish")?.addEventListener("click", () => this.viewOptions.onComplete?.(result));
    }

    showToast(message) {
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2200);
    }
}
