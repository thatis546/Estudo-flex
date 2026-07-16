import assert from "node:assert/strict";
import test from "node:test";
import { state, STATE_SCHEMA_VERSION } from "../core/state.js";

test.beforeEach(() => state.reset());

test("migra um perfil antigo e cria o registro do idioma ausente", () => {
    state.initialize({
        profile: {
            name: "Tamires",
            language: "EN",
            levelTag: "B1",
            levelResult: { cefr: "B1", score: 7, completedAt: "2026-01-01" }
        }
    });

    assert.equal(state.schemaVersion, STATE_SCHEMA_VERSION);
    assert.equal(state.currentLanguage, "en");
    assert.equal(state.getLanguage("en").level, "B1");
    assert.equal(state.profile.levelTag, "B1");
});

test("mantém diagnóstico e nível separados para cada idioma", () => {
    state.initialize({
        currentLanguage: "fr",
        profile: { language: "fr", levelTag: "C1" },
        languages: [
            {
                code: "en",
                level: "C1",
                diagnosticScore: 9,
                diagnosticAnswers: ["a"],
                levelResult: { cefr: "C1", completedAt: "2026-01-01" }
            },
            {
                code: "fr",
                level: "A1",
                diagnosticScore: 0,
                levelResult: { cefr: "A1", completedAt: null }
            }
        ]
    });

    assert.equal(state.profile.levelTag, "A1");
    assert.equal(state.profile.diagnosticScore, 0);
    assert.equal(state.getLanguage("en").diagnosticScore, 9);
    assert.deepEqual(state.getLanguage("en").diagnosticAnswers, ["a"]);
});

test("normaliza tema, números negativos e propriedades desconhecidas", () => {
    state.initialize({
        settings: { theme: "neon" },
        profile: { xp: -40, dailyMinutes: -5 }
    });

    assert.equal(state.settings.theme, "light");
    assert.equal(state.profile.xp, 0);
    assert.equal(state.profile.dailyMinutes, 0);
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        assert.equal(state.set("propriedadeInexistente", 1), false);
    } finally {
        console.warn = originalWarn;
    }
});

test("toJSON devolve uma cópia e não expõe o estado interno", () => {
    state.updateProfile({ name: "Ana" });
    const snapshot = state.toJSON();
    snapshot.profile.name = "Alterado";
    assert.equal(state.profile.name, "Ana");
});
