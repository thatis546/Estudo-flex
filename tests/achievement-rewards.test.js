import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { addActivityXP, registerAchievementEvent, registerDynamicAchievement, synchronizeAchievementRewards, validateAchievementConsistency } from "../services/achievement-service.js";
import { selectLanguage } from "../services/language-profile.service.js";

test.beforeEach(() => state.reset());

test("remove XP antigo de conquistas sem apagar XP de atividade", () => {
    state.initialize({ profile: { xp: 225, activityXP: 0, achievements: [{ id: "first_steps", xp: 50 }, { id: "pro_explorer", xp: 150 }] } });
    synchronizeAchievementRewards();
    assert.equal(state.profile.xp, 25);
    assert.equal(state.profile.achievements.every((item) => item.xp === 0), true);
});

test("configuração e seleção podem criar conquista sem conceder XP", () => {
    selectLanguage("en", { persist: false });
    registerAchievementEvent("onboarding-completed");
    registerAchievementEvent("professional-track-started", { language: "en" });
    assert.equal(state.profile.xp, 0);
});

test("ledger de XP é idempotente", () => {
    selectLanguage("en", { persist: false });
    const first = addActivityXP(8, { idempotencyKey: "communication:en:1", languageCode: "en", reason: "Sessão" });
    const duplicate = addActivityXP(8, { idempotencyKey: "communication:en:1", languageCode: "en", reason: "Sessão" });
    assert.equal(first.awarded, true);
    assert.equal(duplicate.awarded, false);
    assert.equal(state.profile.xp, 8);
});



test("atividade real atualiza sequência e tempo sem duplicar métricas", () => {
    selectLanguage("en", { persist: false });
    const first = addActivityXP(5, {
        idempotencyKey: "review:en:day-1",
        languageCode: "en",
        reason: "Revisão",
        earnedAt: "2026-07-14T12:00:00",
        durationMinutes: 4
    });
    const duplicate = addActivityXP(5, {
        idempotencyKey: "review:en:day-1",
        languageCode: "en",
        reason: "Revisão",
        earnedAt: "2026-07-14T12:05:00",
        durationMinutes: 4
    });
    addActivityXP(8, {
        idempotencyKey: "communication:en:day-2",
        languageCode: "en",
        reason: "Oratória",
        earnedAt: "2026-07-15T12:00:00",
        durationMinutes: 2.5
    });

    assert.equal(first.awarded, true);
    assert.equal(duplicate.awarded, false);
    assert.equal(state.profile.learning.streak, 2);
    assert.equal(state.profile.learning.lastStudyDate, "2026-07-15");
    assert.equal(state.profile.learning.totalStudyMinutes, 6.5);
});

test("sequência reinicia depois de uma pausa maior que um dia", () => {
    selectLanguage("en", { persist: false });
    addActivityXP(5, {
        idempotencyKey: "activity:day-1",
        languageCode: "en",
        earnedAt: "2026-07-10T12:00:00"
    });
    addActivityXP(5, {
        idempotencyKey: "activity:day-4",
        languageCode: "en",
        earnedAt: "2026-07-13T12:00:00"
    });
    assert.equal(state.profile.learning.streak, 1);
});

test("conquista dinâmica preserva idioma, nome e avatar sem dados fixos", () => {
    state.updateProfile({ name: "Ana", avatar: { imageUrl: "data:image/svg+xml;base64,AAA", validated: true } });
    selectLanguage("it", { persist: false });
    const result = registerDynamicAchievement({ languageCode: "it", title: "Pediu uma pizza em italiano", description: "Você concluiu o pedido durante a prática.", sourceEvidence: "Eu pedi a pizza em italiano ontem.", requiresEvidence: true, xpEarned: 8 });
    assert.equal(result.errors.length, 0);
    assert.equal(result.record.userName, "Ana");
    assert.equal(result.record.language.code, "it");
    assert.equal(result.record.language.name, "Italiano");
    assert.equal(result.record.xpEarned, 8);
});

test("validação rejeita texto contraditório entre ação e idioma", () => {
    const result = validateAchievementConsistency({ userName: "Ana", languageCode: "en", title: "Pediu uma pizza em italiano", description: "Conquista", sourceEvidence: "feito", requiresEvidence: true });
    assert.equal(result.valid, false);
});
