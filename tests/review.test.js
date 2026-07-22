import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { selectLanguage } from "../services/language-profile.service.js";
import { buildFirstActivity, completeLearningActivity } from "../services/lesson.service.js";
import {
    getCurrentReviewQueue,
    getReviewAvailability,
    recordReviewAnswer
} from "../services/review.service.js";

test.beforeEach(() => state.reset());

function prepareLanguage(code = "de", contact = "never") {
    const record = selectLanguage(code, { persist: false });
    record.learningProfile.contact = contact;
    record.setupComplete = true;
    record.setupStatus = "ready";
    record.journeyId = "explorando";
    record.journeyLabel = "Explorando";
    record.diagnosticResult = {
        journeyId: "explorando",
        journeyLabel: "Explorando",
        completedAt: "2026-01-01T00:00:00.000Z"
    };
    return record;
}

test("revisão não inventa conteúdo antes de uma atividade", () => {
    const record = prepareLanguage("de");
    assert.deepEqual(getCurrentReviewQueue(), []);
    assert.equal(getReviewAvailability(record).status, "no-activity");
    assert.deepEqual(record.reviewQueue, []);
});

test("atividade concluída cria apenas revisões com origem comprovada", () => {
    const record = prepareLanguage("es", "basics");
    const activity = buildFirstActivity(record);
    completeLearningActivity(activity, record);

    assert.ok(record.reviewQueue.length > 0);
    assert.ok(record.reviewQueue.every((item) => item.sourceActivityId === activity.id));
    assert.ok(record.reviewQueue.every((item) => item.introducedAt && item.nextReviewAt));
    assert.equal(getReviewAvailability(record).status, "scheduled");
    assert.deepEqual(getCurrentReviewQueue(), []);
});

test("somente itens vencidos entram na revisão", () => {
    const record = prepareLanguage("fr", "sometimes");
    const activity = buildFirstActivity(record);
    completeLearningActivity(activity, record);
    record.reviewQueue[0].nextReviewAt = new Date(Date.now() - 1000).toISOString();

    const queue = getCurrentReviewQueue();
    assert.equal(queue.length, 1);
    assert.equal(queue[0].sourceActivityId, activity.id);
});

test("intervalo de revisão considera contato anterior", () => {
    const beginner = prepareLanguage("en", "never");
    const beginnerActivity = buildFirstActivity(beginner);
    completeLearningActivity(beginnerActivity, beginner);
    beginner.reviewQueue[0].nextReviewAt = new Date(Date.now() - 1000).toISOString();
    const beginnerItem = recordReviewAnswer(beginner.reviewQueue[0].id, "known");
    const beginnerDelay = Date.parse(beginnerItem.nextReviewAt) - Date.now();

    state.reset();
    const advanced = prepareLanguage("en", "advanced");
    const advancedActivity = buildFirstActivity(advanced);
    completeLearningActivity(advancedActivity, advanced);
    advanced.reviewQueue[0].nextReviewAt = new Date(Date.now() - 1000).toISOString();
    const advancedItem = recordReviewAnswer(advanced.reviewQueue[0].id, "known");
    const advancedDelay = Date.parse(advancedItem.nextReviewAt) - Date.now();

    assert.ok(advancedDelay > beginnerDelay);
    assert.equal(advanced.stats.reviewsCompleted, 1);
});
