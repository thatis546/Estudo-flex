import test from "node:test";
import assert from "node:assert/strict";
import { buildAchievementShareFile } from "../services/share.service.js";

test("arquivo compartilhável usa somente dados da conquista", async () => {
    const file = await buildAchievementShareFile({
        id: "pizza-it",
        key: "pizza-it",
        title: "Pediu uma pizza em italiano",
        description: "Fez o pedido em uma situação real.",
        userName: "Ana",
        unlockedAt: "2026-07-16T12:00:00.000Z",
        xpEarned: 8,
        streakDays: 2,
        language: { code: "it", name: "Italiano", nativeName: "Italiano", flag: "🇮🇹" },
        avatar: { imageUrl: "" }
    });
    assert.match(file.name, /pizza-it\.(svg|png)$/);
    if (file.type === "image/svg+xml") {
        const source = await file.text();
        assert.match(source, /Pediu uma pizza em italiano/);
        assert.match(source, /Ana/);
        assert.match(source, /Italiano/);
        assert.doesNotMatch(source, /English|Inglês/);
    }
});
