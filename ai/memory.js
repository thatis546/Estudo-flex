const DEFAULT_KEY = "estudoFlex.ai.memory.v1";

function getStore() {
    try { return globalThis.localStorage || null; } catch { return null; }
}

function createId() {
    return globalThis.crypto?.randomUUID?.() || `memory-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class MemoryStore {
    constructor({ storageKey = DEFAULT_KEY, maxItems = 200 } = {}) {
        this.storageKey = storageKey;
        this.maxItems = Math.max(1, Number(maxItems) || 200);
    }

    list() { return this._read(); }

    add(item) {
        if (!item?.type || !String(item.text ?? "").trim()) throw new TypeError("Memória inválida.");
        const memories = this._read();
        const normalized = {
            id: item.id || createId(),
            type: String(item.type),
            text: String(item.text).trim(),
            languageId: item.languageId || null,
            confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.5) || 0)),
            source: item.source || "conversation",
            userConfirmed: Boolean(item.userConfirmed),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const duplicate = memories.find((memory) =>
            memory.type === normalized.type &&
            memory.languageId === normalized.languageId &&
            String(memory.text).toLowerCase() === normalized.text.toLowerCase()
        );
        if (duplicate) Object.assign(duplicate, normalized, { id: duplicate.id, createdAt: duplicate.createdAt });
        else memories.push(normalized);
        this._write(memories.slice(-this.maxItems));
        return duplicate || normalized;
    }

    update(id, patch = {}) {
        const memories = this._read();
        const memory = memories.find((item) => item.id === id);
        if (!memory) return null;
        const { id: ignoredId, ...safePatch } = patch;
        Object.assign(memory, safePatch, { updatedAt: new Date().toISOString() });
        this._write(memories);
        return memory;
    }

    remove(id) {
        const memories = this._read();
        const next = memories.filter((item) => item.id !== id);
        this._write(next);
        return next.length !== memories.length;
    }

    relevant({ languageId = null, types = [], limit = 12 } = {}) {
        return this._read()
            .filter((item) => !languageId || !item.languageId || item.languageId === languageId)
            .filter((item) => !types.length || types.includes(item.type))
            .slice(-Math.max(1, Number(limit) || 12));
    }

    clear() {
        try { getStore()?.removeItem(this.storageKey); } catch { /* indisponível */ }
    }

    _read() {
        try {
            const value = JSON.parse(getStore()?.getItem(this.storageKey) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    _write(value) {
        try {
            getStore()?.setItem(this.storageKey, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }
}

export const shouldAskPermission = (memory) =>
    ["personal_interest", "person_name", "brand_preference", "sensitive_detail"].includes(memory?.type);
export const shouldInferSilently = (memory) =>
    ["learning_pattern", "session_length", "revision_need", "error_pattern"].includes(memory?.type);
