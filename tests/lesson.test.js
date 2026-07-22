import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { selectLanguage } from "../services/language-profile.service.js";
import {
    buildFirstActivity,
    completeLearningActivity,
    getContactDifficulty,
    hasCompletedLearningActivity
} from "../services/lesson.service.js";

test.beforeEach(() => state.reset());

test("primeira atividade adapta quantidade e orientação ao contato informado", () => {
    const record = selectLanguage("it", { persist: false });
    record.learningProfile.contact = "never";
    const beginner = buildFirstActivity(record);

    record.learningProfile.contact = "advanced";
    const advanced = buildFirstActivity(record);

    assert.equal(beginner.items.length, getContactDifficulty("never").itemCount);
    assert.equal(advanced.items.length, getContactDifficulty("advanced").itemCount);
    assert.notEqual(beginner.difficulty.id, advanced.difficulty.id);
});

test("conclusão é idempotente e registra atividade antes da revisão", () => {
    const record = selectLanguage("fr", { persist: false });
    record.learningProfile.contact = "basics";
    const activity = buildFirstActivity(record);

    const first = completeLearningActivity(activity, record);
    const second = completeLearningActivity(activity, record);

    assert.equal(first.id, second.id);
    assert.equal(record.stats.lessonsCompleted, 1);
    assert.equal(record.activityHistory.length, 1);
    assert.equal(hasCompletedLearningActivity(record), true);
});
