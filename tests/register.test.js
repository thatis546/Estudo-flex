import test from "node:test";
import assert from "node:assert/strict";
import { COMPONENT_MODULES, registerComponents } from "../components/register.js";

test("registro isola falha de um componente sem interromper os demais", async () => {
    const failedPath = "./profile/ef-avatar-editor.js";
    const imported = [];

    const result = await registerComponents({
        importer: async (path) => {
            imported.push(path);
            if (path === failedPath) throw new Error("arquivo ausente");
            return {};
        }
    });

    assert.equal(imported.length, COMPONENT_MODULES.length);
    assert.equal(result.failures.length, 1);
    assert.equal(result.failures[0].path, failedPath);
    assert.equal(result.loaded.length, COMPONENT_MODULES.length - 1);
});

test("manifesto de componentes não possui caminhos ou tags duplicados", () => {
    const paths = COMPONENT_MODULES.map((item) => item.path);
    const tags = COMPONENT_MODULES.map((item) => item.tag);
    assert.equal(new Set(paths).size, paths.length);
    assert.equal(new Set(tags).size, tags.length);
});
