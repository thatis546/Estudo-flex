import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { selectLanguage } from "../services/language-profile.service.js";
import { getCurrentReviewQueue, recordReviewAnswer } from "../services/review.service.js";

test.beforeEach(() => state.reset());

test("revisão rápida cria conteúdo por idioma", () => {
    selectLanguage("de", { persist: false });
    const queue = getCurrentReviewQueue();
    assert.ok(queue.length > 0);
    assert.ok(queue.every((item) => item.id && item.front && item.back));
});

test("resposta da revisão atualiza repetição e estatísticas", () => {
    selectLanguage("es", { persist: false });
    const queue = getCurrentReviewQueue();
    recordReviewAnswer(queue[0].id, "known");
    assert.equal(queue[0].seen, 1);
    assert.equal(state.getLanguage("es").stats.reviewsCompleted, 1);
});
