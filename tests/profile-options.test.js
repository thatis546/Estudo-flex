import test from "node:test";
import assert from "node:assert/strict";
import { getProfileOptionLabel } from "../core/profile-options.js";

test("traduz valores internos do onboarding para rótulos em português", () => {
    assert.equal(getProfileOptionLabel("en", "lifeContext", "Work"), "Trabalho");
    assert.equal(getProfileOptionLabel("en", "learningStyle", "Listening"), "Auditivo");
});

test("preserva valores personalizados que não pertencem ao catálogo", () => {
    assert.equal(getProfileOptionLabel("en", "lifeContext", "Pesquisa acadêmica"), "Pesquisa acadêmica");
});
