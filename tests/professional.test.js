import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { selectLanguage, saveLanguageSetup, saveLanguageDiagnostic } from "../services/language-profile.service.js";
import { completeProfessionalModule, getCurrentModules, getCurrentTrackState, selectProfessionalTrack } from "../services/professional.js";

function readyLanguage(code) {
    selectLanguage(code, { persist: false });
    saveLanguageSetup({ goal: "work", goalDescription: "Usar no trabalho internacional", useCase: "Reuniões", contact: "sometimes", dailyMinutes: 20, goalDetails: { deadline: "1-year", frequency: "3x", interests: ["Negócios"] } });
    saveLanguageDiagnostic({ journeyId: "construindo", score: 20, confidence: .6, answers: [] });
}

test.beforeEach(() => state.reset());

test("trilha profissional abre módulos e progresso real", () => {
    readyLanguage("en");
    assert.equal(selectProfessionalTrack("business"), true);
    const modules = getCurrentModules();
    assert.ok(modules.length > 0);
    const completed = completeProfessionalModule(modules[0].id, { response: "I would organize the meeting goals, responsibilities and delivery dates clearly." });
    assert.equal(completed.id, modules[0].id);
    assert.equal(getCurrentTrackState().completedModules.includes(modules[0].id), true);
});

test("trilhas e respostas não vazam entre idiomas", () => {
    readyLanguage("en");
    selectProfessionalTrack("business");
    const englishTrack = state.getLanguage("en").professional.selectedTrack;
    readyLanguage("fr");
    selectProfessionalTrack("engineering");
    assert.equal(state.getLanguage("fr").professional.selectedTrack, "engineering");
    assert.equal(state.getLanguage("en").professional.selectedTrack, englishTrack);
});

test("atualizar resposta concluída não duplica lição nem XP", () => {
    readyLanguage("en");
    selectProfessionalTrack("business");
    const module = getCurrentModules()[0];
    completeProfessionalModule(module.id, { response: "I would organize the meeting goals, responsibilities and delivery dates clearly." });
    const firstLessons = state.getLanguage("en").stats.lessonsCompleted;
    const firstXP = state.profile.xp;
    completeProfessionalModule(module.id, { response: "I would update the plan, confirm responsibilities and communicate the revised delivery dates." });
    assert.equal(state.getLanguage("en").stats.lessonsCompleted, firstLessons);
    assert.equal(state.profile.xp, firstXP);
});
