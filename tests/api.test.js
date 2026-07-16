import assert from "node:assert/strict";
import test from "node:test";
import { api } from "../core/api.js";
import { config } from "../core/config.js";

test("serializa corpos JSON e monta a URL sem barras duplicadas", async () => {
    const originalFetch = globalThis.fetch;
    config.apiBase = "https://example.test/api/";
    let captured = null;
    globalThis.fetch = async (url, options) => {
        captured = { url, options };
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" }
        });
    };

    try {
        const result = await api("/profile", {
            method: "POST",
            body: { name: "Ana" }
        });
        assert.deepEqual(result, { ok: true });
        assert.equal(captured.url, "https://example.test/api/profile");
        assert.equal(captured.options.body, JSON.stringify({ name: "Ana" }));
        assert.equal(captured.options.headers["Content-Type"], "application/json");
    } finally {
        globalThis.fetch = originalFetch;
    }
});


test("não serializa FormData nem força Content-Type", async () => {
    const originalFetch = globalThis.fetch;
    config.apiBase = "/api";
    let captured = null;
    globalThis.fetch = async (url, options) => {
        captured = { url, options };
        return new Response(null, { status: 204 });
    };

    try {
        const formData = new FormData();
        formData.append("name", "Ana");
        await api("upload", { method: "POST", body: formData });
        assert.equal(captured.options.body, formData);
        assert.equal(captured.options.headers["Content-Type"], undefined);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
