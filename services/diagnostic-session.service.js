import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { getDiagnosticQuestions } from "../data/diagnostic-bank.js";
import { evaluateLanguageDiagnostic, scoreDiagnosticAnswer } from "../core/diagnostic.js";
import { getCurrentLanguageRecord, saveLanguageDiagnostic } from "./language-profile.service.js";

export class DiagnosticSession {
    constructor(record = getCurrentLanguageRecord()) {
        if (!record) throw new Error("Idioma não selecionado para o diagnóstico.");
        this.record = record;
        this.questions = getDiagnosticQuestions(record.code);
        if (this.questions.length < 10) throw new Error("Banco de diagnóstico incompleto para este idioma.");
        const progress = record.diagnosticProgress || {};
        this.step = Math.min(this.questions.length, Math.max(0, Number(progress.step) || 0));
        this.answers = Array.isArray(progress.answers) ? [...progress.answers] : [];
        this.scores = Array.isArray(progress.scores) ? [...progress.scores] : [];
    }

    get currentQuestion() { return this.questions[this.step] || null; }
    get complete() { return this.step >= this.questions.length; }
    get progressPercent() { return Math.round((Math.min(this.step + 1, this.questions.length) / this.questions.length) * 100); }

    setAnswer(answer, selectedPoints = 0) {
        const question = this.currentQuestion;
        if (!question) return 0;
        this.answers[this.step] = String(answer ?? "").trim();
        this.scores[this.step] = scoreDiagnosticAnswer(question, answer, selectedPoints);
        this.persist();
        return this.scores[this.step];
    }

    canContinue() {
        return Boolean(String(this.answers[this.step] ?? "").trim());
    }

    next() {
        if (!this.canContinue()) return false;
        this.step += 1;
        this.persist();
        return true;
    }

    previous() {
        this.step = Math.max(0, this.step - 1);
        this.persist();
    }

    persist() {
        this.record.diagnosticProgress = {
            step: this.step,
            answers: [...this.answers],
            scores: [...this.scores],
            questionIds: this.questions.map((question) => question.id)
        };
        storage.save();
    }

    finish() {
        const result = evaluateLanguageDiagnostic({
            questions: this.questions,
            answers: this.answers,
            scores: this.scores,
            contact: this.record.learningProfile?.contact || ""
        });
        saveLanguageDiagnostic({ ...result, answers: this.answers });
        return result;
    }

    reset() {
        this.step = 0;
        this.answers = [];
        this.scores = [];
        this.persist();
    }
}

export function createCurrentDiagnosticSession() {
    return new DiagnosticSession(state.getLanguage(state.currentLanguage));
}
