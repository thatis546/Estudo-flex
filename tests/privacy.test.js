import test from "node:test";
import assert from "node:assert/strict";
import { state } from "../core/state.js";
import { addAIMemory, removeAIMemory, removeLanguageInterest, setAIMemoryEnabled } from "../services/profile-privacy.service.js";
import { selectLanguage, saveLanguageSetup } from "../services/language-profile.service.js";

test.beforeEach(() => state.reset());

test("estudante pode excluir interesse específico de um idioma", () => {
    selectLanguage("fr", { persist: false });
    saveLanguageSetup({ goalDetails: { interests: ["Engenharia", "Filmes"] } });
    removeLanguageInterest("fr", "Filmes");
    assert.deepEqual(state.getLanguage("fr").learningProfile.goalDetails.interests, ["Engenharia"]);
});

test("memória excluída e bloqueada não é reaprendida", async () => {
    const memory = await addAIMemory({ text: "Prefere exercícios curtos", languageCode: "en" });
    await removeAIMemory(memory.id, { blockRelearning: true });
    const repeated = await addAIMemory({ text: "Prefere exercícios curtos", languageCode: "en" });
    assert.equal(repeated, null);
    assert.equal(state.profile.aiMemory.items.length, 0);
});

test("memória pode ser completamente desativada", async () => {
    setAIMemoryEnabled(false);
    const memory = await addAIMemory({ text: "Gosta de música" });
    assert.equal(memory, null);
});

test("memória excluída sem bloqueio pode ser reaprendida depois", async () => {
    const memory = await addAIMemory({ text: "Prefere exemplos de engenharia", languageCode: "en" });
    await removeAIMemory(memory.id, { blockRelearning: false });
    const repeated = await addAIMemory({ text: "Prefere exemplos de engenharia", languageCode: "en" });
    assert.ok(repeated);
    assert.equal(state.profile.aiMemory.items.length, 1);
    assert.equal(state.profile.aiMemory.blockedFingerprints.length, 0);
});
