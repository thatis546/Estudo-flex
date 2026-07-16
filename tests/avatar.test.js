import test from "node:test";
import assert from "node:assert/strict";
import { validateAvatarMetadata, AVATAR_STYLES } from "../services/avatar.service.js";

test("avatar aceita somente formatos, dimensões e proporções compatíveis", () => {
    assert.equal(validateAvatarMetadata({ type: "image/png", size: 1000, width: 512, height: 512 }).valid, true);
    assert.equal(validateAvatarMetadata({ type: "image/gif", size: 1000, width: 512, height: 512 }).valid, false);
    assert.equal(validateAvatarMetadata({ type: "image/png", size: 1000, width: 100, height: 100 }).valid, false);
});

test("catálogo oferece estilos de bonequinho sem fotografia real", () => {
    assert.ok(AVATAR_STYLES.has("estudo-flex-classic"));
    assert.ok(AVATAR_STYLES.has("cute-cartoon"));
    assert.equal(AVATAR_STYLES.has("real-photo"), false);
});

test("avatar gerado só é salvo após validação inteligente positiva", async () => {
    const { state } = await import("../core/state.js");
    const { generateAvatar } = await import("../services/avatar.service.js");
    state.reset();
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
        imageDataUrl: "data:image/png;base64,AAAA",
        validation: { valid: true, hasSingleFace: true, illustrated: true, isRealPhoto: false, characterCount: 1 }
    }), { status: 200, headers: { "content-type": "application/json" } });
    try {
        const avatar = await generateAvatar({ description: "cabelo escuro ondulado e expressão alegre", style: "cute-cartoon" });
        assert.equal(avatar.validated, true);
        assert.equal(avatar.validation.characterCount, 1);
    } finally {
        globalThis.fetch = previousFetch;
    }
});

test("avatar gerado incompatível é rejeitado e não substitui o atual", async () => {
    const { state } = await import("../core/state.js");
    const { generateAvatar } = await import("../services/avatar.service.js");
    state.reset();
    const previousImage = state.profile.avatar.imageUrl;
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
        imageDataUrl: "data:image/png;base64,BBBB",
        validation: { valid: false, hasSingleFace: false, illustrated: false, isRealPhoto: true, characterCount: 2, reason: "Imagem incompatível." }
    }), { status: 200, headers: { "content-type": "application/json" } });
    try {
        await assert.rejects(
            () => generateAvatar({ description: "cabelo escuro ondulado e expressão alegre", style: "cute-cartoon" }),
            /Imagem incompatível/
        );
        assert.equal(state.profile.avatar.imageUrl, previousImage);
    } finally {
        globalThis.fetch = previousFetch;
    }
});
