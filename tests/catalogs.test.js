import assert from "node:assert/strict";
import test from "node:test";
import { ACHIEVEMENT_CATALOG } from "../data/achievement-catalog.js";
import { EF_LANGUAGES } from "../data/languages.js";
import { PROFESSIONAL_CATALOG } from "../data/professional-catalog.js";

function assertUnique(values, label) {
    assert.equal(new Set(values).size, values.length, `${label} contém identificadores duplicados.`);
}

test("catálogos possuem identificadores únicos e campos essenciais", () => {
    const languageCodes = Object.keys(EF_LANGUAGES);
    assertUnique(languageCodes, "Idiomas");
    for (const code of languageCodes) {
        assert.ok(EF_LANGUAGES[code].name);
        assert.ok(Array.isArray(EF_LANGUAGES[code].diagnostic));
    }

    assertUnique(ACHIEVEMENT_CATALOG.map((item) => item.id), "Conquistas");
    assertUnique(PROFESSIONAL_CATALOG.map((item) => item.id), "Trilhas profissionais");
});
