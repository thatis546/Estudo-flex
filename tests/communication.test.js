import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCommunication } from "../services/communication-lab.service.js";
import { COMMUNICATION_MODULES } from "../data/communication-modules.js";

test("Communication Lab possui os oito módulos definidos", () => {
    assert.equal(COMMUNICATION_MODULES.length, 8);
    assert.deepEqual(COMMUNICATION_MODULES.map((item) => item.id), ["pronunciation", "projection", "clarity", "rhythm", "fillers", "repetition", "intonation", "professional"]);
});

test("análise identifica repetição, muletas e ritmo", () => {
    const report = analyzeCommunication({ transcript: "So I think the project project project is good, so we can continue, you know.", durationSeconds: 20, languageCode: "en", moduleId: "repetition" });
    assert.ok(report.repetitions.some((item) => item.word === "project"));
    assert.ok(report.fillerCount >= 2);
    assert.ok(report.wordsPerMinute > 0);
});

test("relatório não finge produzir análise fonética completa", () => {
    const report = analyzeCommunication({ transcript: "Hello, my name is Ana.", durationSeconds: 10, languageCode: "en", moduleId: "pronunciation" });
    assert.match(report.pronunciationStatus, /serviço de pronúncia do backend/i);
});
