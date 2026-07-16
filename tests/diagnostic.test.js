import test from "node:test";
import assert from "node:assert/strict";
import { evaluateLanguageDiagnostic } from "../core/diagnostic.js";
import { DIAGNOSTIC_BANK } from "../data/diagnostic-bank.js";

const questions = DIAGNOSTIC_BANK.en;

test("todos os idiomas possuem diagnóstico amplo de 12 evidências", () => {
    for (const [code, bank] of Object.entries(DIAGNOSTIC_BANK)) {
        assert.equal(bank.length, 12, `${code} deveria possuir 12 questões`);
        assert.ok(bank.filter((item) => item.type === "text").length >= 3);
        assert.ok(new Set(bank.map((item) => item.category)).size >= 5);
    }
});

test("cumprimento isolado mantém a jornada em Explorando", () => {
    const result = evaluateLanguageDiagnostic({
        questions,
        answers: ["Good morning", ...Array(11).fill("")],
        scores: [4, ...Array(11).fill(0)],
        contact: "never"
    });
    assert.equal(result.journeyId, "explorando");
    assert.equal(result.journeyLabel, "Explorando");
    assert.equal(result.answeredQuestions, 1);
});

test("evidências completas podem chegar a Conectando, nunca a Vivendo", () => {
    const longAnswer = "I can explain my experience with clear examples because learning languages helps me communicate with people, solve practical problems and participate in professional projects every day.";
    const answers = questions.map((question) => question.type === "text" ? longAnswer : "resposta marcada");
    const scores = questions.map((question) => question.type === "choice" ? 4 : 0);
    const result = evaluateLanguageDiagnostic({ questions, answers, scores, contact: "frequent" });
    assert.equal(result.journeyId, "conectando");
    assert.notEqual(result.journeyId, "vivendo");
    assert.ok(result.confidence < 0.8);
});

test("diagnóstico incompleto não inventa nível avançado", () => {
    const answers = questions.map((question, index) => index < 6 ? (question.type === "text" ? "I am Ana from Brazil" : "resposta") : "");
    const scores = questions.map((question, index) => question.type === "choice" && index < 6 ? 4 : 0);
    const result = evaluateLanguageDiagnostic({ questions, answers, scores, contact: "sometimes" });
    assert.ok(["explorando", "descobrindo"].includes(result.journeyId));
});
