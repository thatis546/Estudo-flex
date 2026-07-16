import assert from "node:assert/strict";
import test from "node:test";
import { state, STATE_SCHEMA_VERSION } from "../core/state.js";

test.beforeEach(() => state.reset());

test("migra perfil antigo para registro de idioma e jornadas próprias", () => {
    state.initialize({ profile: { name: "Ana", language: "EN", levelTag: "B1", levelResult: { cefr: "B1", score: 7, completedAt: "2026-01-01" } } });
    assert.equal(state.schemaVersion, STATE_SCHEMA_VERSION);
    assert.equal(state.currentLanguage, "en");
    assert.equal(state.getLanguage("en").journeyLabel, "Conectando");
    assert.equal(state.profile.levelTag, "Conectando");
});

test("mantém diagnóstico separado para cada idioma", () => {
    state.initialize({
        currentLanguage: "fr",
        profile: { language: "fr" },
        languages: [
            { code: "en", setupComplete: true, diagnosticAnswers: ["a"], diagnosticResult: { journeyId: "conectando", score: 9, completedAt: "2026-01-01" } },
            { code: "fr", setupComplete: false, diagnosticResult: { journeyId: "descobrindo", score: 0, completedAt: null } }
        ]
    });
    assert.equal(state.profile.levelTag, "");
    assert.equal(state.getLanguage("fr").setupComplete, false);
    assert.equal(state.getLanguage("en").diagnosticScore, 9);
    assert.deepEqual(state.getLanguage("en").diagnosticAnswers, ["a"]);
});

test("normaliza tema e números negativos", () => {
    state.initialize({ settings: { theme: "neon" }, profile: { xp: -40, dailyMinutes: -5 } });
    assert.equal(state.settings.theme, "light");
    assert.equal(state.profile.xp, 0);
    assert.equal(state.profile.dailyMinutes, 0);
});

test("toJSON devolve cópia isolada", () => {
    state.updateProfile({ name: "Ana" });
    const snapshot = state.toJSON();
    snapshot.profile.name = "Alterado";
    assert.equal(state.profile.name, "Ana");
});
