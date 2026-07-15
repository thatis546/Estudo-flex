export const isSpeechSynthesisAvailable = () =>
    "speechSynthesis" in globalThis && "SpeechSynthesisUtterance" in globalThis;

function clamp(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function speak(text, {
    lang = "pt-BR",
    rate = 1,
    pitch = 1,
    volume = 1,
    voiceName = null
} = {}) {
    if (!isSpeechSynthesisAvailable()) {
        throw new Error("Síntese de voz indisponível.");
    }

    const synthesis = globalThis.speechSynthesis;
    synthesis.cancel();
    const utterance = new globalThis.SpeechSynthesisUtterance(String(text ?? ""));
    utterance.lang = String(lang || "pt-BR");
    utterance.rate = clamp(rate, 0.5, 2, 1);
    utterance.pitch = clamp(pitch, 0, 2, 1);
    utterance.volume = clamp(volume, 0, 1, 1);

    const voices = synthesis.getVoices();
    const normalizedLanguage = utterance.lang.toLowerCase().split("-")[0];
    const selected = voices.find((voice) =>
        voiceName
            ? voice.name === voiceName
            : String(voice.lang).toLowerCase().startsWith(normalizedLanguage)
    );
    if (selected) utterance.voice = selected;
    synthesis.speak(utterance);
    return utterance;
}

export const stopSpeaking = () => {
    if ("speechSynthesis" in globalThis) globalThis.speechSynthesis.cancel();
};

export const listVoices = () => isSpeechSynthesisAvailable()
    ? globalThis.speechSynthesis.getVoices().map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
        default: voice.default
    }))
    : [];
