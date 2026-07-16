import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function exists(relativePath) {
    await access(path.join(root, relativePath));
    return true;
}

test("inicialização não depende mais de components/register.js", async () => {
    const app = await readFile(path.join(root, "core/app.js"), "utf8");
    assert.equal(app.includes("components/register.js"), false);
    assert.match(app, /registerComponents/);
});

test("arquivos que causaram 404 fazem parte do pacote", async () => {
    await assert.doesNotReject(() => exists("services/review.service.js"));
    await assert.doesNotReject(() => exists("services/speech-recognition.service.js"));
});

test("manifesto possui capturas mobile e wide válidas", async () => {
    const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
    assert.equal(manifest.version, "0.8.2");
    assert.ok(Array.isArray(manifest.screenshots));
    assert.ok(manifest.screenshots.some((item) => !item.form_factor));
    assert.ok(manifest.screenshots.some((item) => item.form_factor === "wide"));
    for (const screenshot of manifest.screenshots) {
        await assert.doesNotReject(() => exists(screenshot.src.replace(/^\.\//, "")));
    }
});

test("diagnóstico de publicação está incluído", async () => {
    const html = await readFile(path.join(root, "diagnostico-publicacao.html"), "utf8");
    assert.match(html, /review\.service\.js/);
    assert.match(html, /speech-recognition\.service\.js/);
    assert.match(html, /0\.8\.2/);
});
