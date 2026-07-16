import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { getCurrentModules, selectProfessionalTrack } from "../services/professional.js";

test("trilha profissional expõe as subáreas como módulos atuais", () => {
    state.reset();
    assert.equal(selectProfessionalTrack("business"), true);
    const modules = getCurrentModules();
    assert.ok(modules.length > 0);
    assert.equal(modules[0].id, "business-administration");
    state.reset();
});
