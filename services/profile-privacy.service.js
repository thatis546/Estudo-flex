import { state } from "../core/state.js";
import { storage } from "../core/storage.js";

function normalize(value) {
    return String(value ?? "").trim().toLocaleLowerCase("pt-BR");
}

function fallbackHash(value) {
    let hash = 2166136261;
    for (const character of value) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return `fnv-${(hash >>> 0).toString(16)}`;
}

export async function createMemoryFingerprint(value) {
    const normalized = normalize(value);
    if (!normalized) return "";
    if (globalThis.crypto?.subtle && typeof TextEncoder !== "undefined") {
        const bytes = new TextEncoder().encode(normalized);
        const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    return fallbackHash(normalized);
}

export function removeLanguageInterest(languageCode, interest) {
    const record = state.getLanguage(languageCode);
    if (!record) return false;
    const current = record.learningProfile?.goalDetails?.interests || [];
    record.learningProfile.goalDetails.interests = current.filter((item) => normalize(item) !== normalize(interest));
    if (record.code === state.currentLanguage) state.syncProfileCompatibility(record);
    storage.save();
    return true;
}

export async function addAIMemory({ text, category = "context", source = "mentor", languageCode = state.currentLanguage } = {}) {
    if (!state.profile.aiMemory?.enabled) return null;
    const cleanText = String(text ?? "").trim();
    if (!cleanText) return null;
    const fingerprint = await createMemoryFingerprint(cleanText);
    if (state.profile.aiMemory.blockedFingerprints.includes(fingerprint)) return null;
    const existing = state.profile.aiMemory.items.find((item) => item.fingerprint === fingerprint);
    if (existing) return existing;
    const memory = {
        id: globalThis.crypto?.randomUUID?.() || `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: cleanText,
        category,
        source,
        languageCode: String(languageCode || "").toLowerCase(),
        fingerprint,
        createdAt: new Date().toISOString()
    };
    state.profile.aiMemory.items.unshift(memory);
    state.profile.aiMemory.items = state.profile.aiMemory.items.slice(0, 200);
    storage.save();
    return memory;
}

export async function removeAIMemory(memoryId, { blockRelearning = true } = {}) {
    const memory = state.profile.aiMemory?.items?.find((item) => item.id === memoryId);
    if (!memory) return false;
    state.profile.aiMemory.items = state.profile.aiMemory.items.filter((item) => item.id !== memoryId);
    if (blockRelearning) {
        const fingerprint = memory.fingerprint || await createMemoryFingerprint(memory.text);
        if (fingerprint && !state.profile.aiMemory.blockedFingerprints.includes(fingerprint)) {
            state.profile.aiMemory.blockedFingerprints.push(fingerprint);
        }
    }
    storage.save();
    return true;
}

export function clearAIMemory({ keepBlocks = true } = {}) {
    state.profile.aiMemory.items = [];
    if (!keepBlocks) state.profile.aiMemory.blockedFingerprints = [];
    storage.save();
}

export function setAIMemoryEnabled(enabled) {
    state.profile.aiMemory.enabled = Boolean(enabled);
    storage.save();
    return state.profile.aiMemory.enabled;
}

export function allowAIMemoryRelearning() {
    state.profile.aiMemory.blockedFingerprints = [];
    storage.save();
}

export function deleteEntireProfile() {
    storage.clear();
    return true;
}
