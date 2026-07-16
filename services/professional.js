import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { PROFESSIONAL_CATALOG } from "../data/professional-catalog.js";
import { addActivityXP, registerAchievementEvent } from "./achievement-service.js";

function getLanguageRecord(languageCode = state.currentLanguage) {
    return state.getLanguage(languageCode);
}

function ensureProfessional(languageCode = state.currentLanguage) {
    const record = getLanguageRecord(languageCode);
    if (!record) return null;
    if (!record.professional || typeof record.professional !== "object") {
        record.professional = { selectedTrack: "", tracks: {} };
    }
    if (typeof record.professional.selectedTrack !== "string") {
        record.professional.selectedTrack = "";
    }
    if (!record.professional.tracks || typeof record.professional.tracks !== "object") {
        record.professional.tracks = {};
    }
    return record.professional;
}

function ensureTrackState(trackId, languageCode = state.currentLanguage) {
    const professional = ensureProfessional(languageCode);
    if (!professional) return null;
    if (!professional.tracks[trackId] || typeof professional.tracks[trackId] !== "object") {
        professional.tracks[trackId] = {
            activeModule: "",
            progress: {},
            completedModules: [],
            unlockedModules: [],
            responses: {},
            updatedAt: null
        };
    }
    return professional.tracks[trackId];
}

function emitTrackChange(track, languageCode = state.currentLanguage) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("professional-track-changed", { detail: { track, languageCode } }));
}

export const getProfessionalTracks = () => [...PROFESSIONAL_CATALOG];

export function selectProfessionalTrack(trackId, languageCode = state.currentLanguage) {
    const normalizedId = String(trackId ?? "").trim();
    const track = PROFESSIONAL_CATALOG.find((item) => item.id === normalizedId);
    const professional = ensureProfessional(languageCode);
    if (!track || !professional) return false;
    professional.selectedTrack = track.id;
    ensureTrackState(track.id, languageCode);
    storage.save();
    registerAchievementEvent("professional-track-started", { language: languageCode });
    emitTrackChange(track, languageCode);
    return true;
}

export function getUserTrack(languageCode = state.currentLanguage) {
    const professional = ensureProfessional(languageCode);
    const trackId = professional?.selectedTrack || "";
    return PROFESSIONAL_CATALOG.find((item) => item.id === trackId) || null;
}

export function hasProfessionalTrack(languageCode = state.currentLanguage) {
    return Boolean(getUserTrack(languageCode));
}

export function clearProfessionalTrack(languageCode = state.currentLanguage) {
    const professional = ensureProfessional(languageCode);
    if (!professional) return false;
    const hadTrack = Boolean(professional.selectedTrack);
    professional.selectedTrack = "";
    storage.save();
    emitTrackChange(null, languageCode);
    return hadTrack;
}

export function getCurrentModules(languageCode = state.currentLanguage) {
    const track = getUserTrack(languageCode);
    return Array.isArray(track?.subareas) ? [...track.subareas] : Array.isArray(track?.modules) ? [...track.modules] : [];
}

export function getProfessionalModule(moduleId, languageCode = state.currentLanguage) {
    return getCurrentModules(languageCode).find((item) => item.id === String(moduleId ?? "").trim()) || null;
}

export function getCurrentTrackState(languageCode = state.currentLanguage) {
    const track = getUserTrack(languageCode);
    return track ? ensureTrackState(track.id, languageCode) : null;
}

export function startProfessionalModule(moduleId, languageCode = state.currentLanguage) {
    const track = getUserTrack(languageCode);
    const module = getProfessionalModule(moduleId, languageCode);
    if (!track || !module) return null;
    const trackState = ensureTrackState(track.id, languageCode);
    const current = trackState.progress[module.id] || {};
    trackState.activeModule = module.id;
    trackState.progress[module.id] = {
        status: current.status === "completed" ? "completed" : "in-progress",
        progress: current.status === "completed" ? 100 : Math.max(10, Number(current.progress) || 10),
        startedAt: current.startedAt || new Date().toISOString(),
        lastOpenedAt: new Date().toISOString()
    };
    if (!trackState.unlockedModules.includes(module.id)) trackState.unlockedModules.push(module.id);
    trackState.updatedAt = new Date().toISOString();
    storage.save();
    return module;
}

export function saveProfessionalResponse(moduleId, response, languageCode = state.currentLanguage) {
    const track = getUserTrack(languageCode);
    const module = getProfessionalModule(moduleId, languageCode);
    if (!track || !module) return false;
    const trackState = ensureTrackState(track.id, languageCode);
    trackState.responses[module.id] = {
        text: String(response || "").trim(),
        updatedAt: new Date().toISOString()
    };
    const progress = trackState.progress[module.id] || {};
    trackState.progress[module.id] = { ...progress, status: "in-progress", progress: Math.max(40, Number(progress.progress) || 0), lastOpenedAt: new Date().toISOString() };
    storage.save();
    return true;
}

export function completeProfessionalModule(moduleId, { response = "", languageCode = state.currentLanguage } = {}) {
    const record = getLanguageRecord(languageCode);
    const track = getUserTrack(languageCode);
    const module = getProfessionalModule(moduleId, languageCode);
    if (!record || !track || !module) return null;
    const cleanResponse = String(response || "").trim();
    if (cleanResponse.length < 20) throw new Error("Responda ao desafio com um pouco mais de detalhe antes de concluir.");
    const trackState = ensureTrackState(track.id, languageCode);
    const wasCompleted = trackState.progress[module.id]?.status === "completed"
        || trackState.completedModules.includes(module.id);
    saveProfessionalResponse(module.id, cleanResponse, languageCode);
    const completedAt = trackState.progress[module.id]?.completedAt || new Date().toISOString();
    trackState.progress[module.id] = {
        ...(trackState.progress[module.id] || {}),
        status: "completed",
        progress: 100,
        completedAt,
        lastOpenedAt: new Date().toISOString()
    };
    if (!trackState.completedModules.includes(module.id)) trackState.completedModules.push(module.id);
    if (!wasCompleted) {
        record.stats.lessonsCompleted = Math.max(0, Number(record.stats.lessonsCompleted) || 0) + 1;
    }
    storage.save();
    addActivityXP(15, {
        idempotencyKey: `professional:${record.code}:${track.id}:${module.id}`,
        reason: `${track.title}: ${module.title}`,
        languageCode: record.code,
        activity: { type: "professional", title: `${track.title}: ${module.title}`, completedAt: new Date().toISOString() }
    });
    return module;
}

export function getProfessionalProgress(languageCode = state.currentLanguage) {
    const modules = getCurrentModules(languageCode);
    const trackState = getCurrentTrackState(languageCode);
    if (!modules.length || !trackState) return 0;
    const total = modules.reduce((sum, module) => sum + Math.min(100, Math.max(0, Number(trackState.progress[module.id]?.progress) || 0)), 0);
    return Math.round(total / modules.length);
}
