import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { PROFESSIONAL_CATALOG } from "../data/professional-catalog.js";
import { registerAchievementEvent } from "./achievement-service.js";

function ensureProfessionalProfile() {
    if (!state.profile.professional || typeof state.profile.professional !== "object") {
        state.profile.professional = {
            track: null,
            progress: {},
            completedModules: [],
            unlockedModules: []
        };
    }
    return state.profile.professional;
}

function emitTrackChange(track) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent("professional-track-changed", { detail: { track } })
    );
}

export const getProfessionalTracks = () => [...PROFESSIONAL_CATALOG];

export function selectProfessionalTrack(trackId) {
    const normalizedId = String(trackId ?? "").trim();
    const track = PROFESSIONAL_CATALOG.find((item) => item.id === normalizedId);
    if (!track) return false;

    const professional = ensureProfessionalProfile();
    const firstSelection = !professional.track;
    professional.track = track.id;
    state.profile.professionalTrack = track.id;
    storage.save();

    if (firstSelection) registerAchievementEvent("professional-track-started");
    emitTrackChange(track);
    return true;
}

export function getUserTrack() {
    const professional = ensureProfessionalProfile();
    const trackId = professional.track || state.profile.professionalTrack;
    return PROFESSIONAL_CATALOG.find((item) => item.id === trackId) || null;
}

export function hasProfessionalTrack() {
    return Boolean(getUserTrack());
}

export function clearProfessionalTrack() {
    const professional = ensureProfessionalProfile();
    const hadTrack = Boolean(professional.track || state.profile.professionalTrack);
    professional.track = null;
    state.profile.professionalTrack = "";
    storage.save();
    emitTrackChange(null);
    return hadTrack;
}

export function getCurrentModules() {
    const track = getUserTrack();
    if (Array.isArray(track?.modules)) return [...track.modules];
    if (Array.isArray(track?.subareas)) return [...track.subareas];
    return [];
}
