import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { isLanguageReady, saveLanguageDiagnostic, saveLanguageSetup, selectLanguage } from "../services/language-profile.service.js";

test.beforeEach(() => state.reset());

function configure(code, setup, journeyId = "descobrindo") {
    selectLanguage(code, { persist: false });
    saveLanguageSetup(setup);
    return saveLanguageDiagnostic({ journeyId, score: 24, confidence: 0.66, answers: ["evidência"] });
}

test("um novo idioma começa sem jornada presumida", () => {
    const french = selectLanguage("fr", { persist: false });
    assert.equal(french.journeyId, "");
    assert.equal(french.setupComplete, false);
    assert.equal(isLanguageReady(french), false);
    assert.equal(state.profile.levelTag, "");
});

test("objetivo, uso, diagnóstico e progresso permanecem separados por idioma", () => {
    configure("fr", {
        goal: "study", goalDescription: "Estudar engenharia na França", useCase: "Aulas e projetos universitários",
        lifeContext: "university", contact: "never", dailyMinutes: 20,
        goalDetails: { deadline: "1-year", frequency: "5x", interests: ["Engenharia"] }
    }, "descobrindo");
    configure("en", {
        goal: "work", goalDescription: "Participar de reuniões internacionais", useCase: "Reuniões e relatórios",
        lifeContext: "work", contact: "sometimes", dailyMinutes: 30,
        goalDetails: { deadline: "6-months", frequency: "3x", interests: ["Finanças"] }
    }, "construindo");

    assert.equal(state.getLanguage("fr").learningProfile.goalDescription, "Estudar engenharia na França");
    assert.equal(state.getLanguage("fr").journeyLabel, "Descobrindo");
    assert.equal(state.getLanguage("en").learningProfile.useCase, "Reuniões e relatórios");
    assert.equal(state.getLanguage("en").journeyLabel, "Construindo");
    selectLanguage("fr", { persist: false });
    assert.equal(state.profile.goalDescription, "Estudar engenharia na França");
    assert.equal(state.profile.levelTag, "Descobrindo");
});

test("editar finalidade ou interesses não apaga diagnóstico concluído", () => {
    configure("it", {
        goal: "travel", goalDescription: "Conversar durante uma viagem", useCase: "Restaurantes e hotéis",
        lifeContext: "travel", contact: "basics", dailyMinutes: 15,
        goalDetails: { deadline: "6-months", frequency: "3x", interests: ["Gastronomia"] }
    }, "descobrindo");
    const completedAt = state.getLanguage("it").diagnosticResult.completedAt;
    saveLanguageSetup({ goalDescription: "Morar na Itália", goalDetails: { interests: ["Cultura", "Gastronomia"] } });
    assert.equal(state.getLanguage("it").diagnosticResult.completedAt, completedAt);
    assert.equal(state.getLanguage("it").setupComplete, true);
});
