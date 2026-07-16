import test from "node:test";
import assert from "node:assert/strict";
import { evaluateShortDiagnostic } from "../core/diagnostic.js";

test("diagnóstico curto não atribui nível avançado com apenas três questões", () => {
    const result = evaluateShortDiagnostic([3, 3, 3], 3);
    assert.equal(result.levelTag, "B1");
    assert.equal(result.level, 3);
    assert.ok(result.confidence <= 0.7);
});

test("diagnóstico curto diferencia respostas iniciais e intermediárias", () => {
    assert.equal(evaluateShortDiagnostic([0, 0, 1], 3).levelTag, "A1");
    assert.equal(evaluateShortDiagnostic([1, 2, 2], 3).levelTag, "A2");
});
