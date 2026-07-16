import assert from "node:assert/strict";
import test from "node:test";
import { state } from "../core/state.js";
import { storage } from "../core/storage.js";

const originalWindow = globalThis.window;
const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

test.afterEach(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;

    if (originalLocalStorageDescriptor) {
        Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
        delete globalThis.localStorage;
    }
    state.reset();
});

test("mantém a interface sincronizada quando o localStorage recusa a gravação", () => {
    const events = [];
    globalThis.window = {
        dispatchEvent(event) {
            events.push(event.type);
            return true;
        }
    };
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            setItem() {
                throw new Error("quota excedida");
            }
        }
    });

    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        state.updateProfile({ name: "Ana" });
        assert.equal(storage.save(), false);
    } finally {
        console.error = originalConsoleError;
    }
    assert.deepEqual(events, ["state-updated"]);
    assert.equal(state.profile.name, "Ana");
});
