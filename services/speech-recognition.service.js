const RecognitionClass = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

export class SpeechRecognitionService {
    constructor() {
        this.recognition = null;
        this.finalTranscript = "";
        this.interimTranscript = "";
        this.resolveStop = null;
        this.stopTimer = null;
    }

    isSupported() {
        return Boolean(RecognitionClass);
    }

    start({ lang = "en-US", onUpdate = () => {}, onError = () => {} } = {}) {
        if (!this.isSupported()) return false;
        this.cancel();
        this.finalTranscript = "";
        this.interimTranscript = "";

        const recognition = new RecognitionClass();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interim = "";
            let finalChunk = "";
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index]?.[0]?.transcript || "";
                if (event.results[index].isFinal) finalChunk += transcript;
                else interim += transcript;
            }
            if (finalChunk.trim()) {
                this.finalTranscript = `${this.finalTranscript} ${finalChunk}`.trim();
            }
            this.interimTranscript = interim.trim();
            onUpdate({
                final: this.finalTranscript,
                interim: this.interimTranscript,
                combined: `${this.finalTranscript} ${this.interimTranscript}`.trim()
            });
        };

        recognition.onerror = (event) => {
            if (!["no-speech", "aborted"].includes(event.error)) onError(event);
        };

        recognition.onend = () => this.finishStop();

        this.recognition = recognition;
        recognition.start();
        return true;
    }

    finishStop() {
        if (this.stopTimer !== null) {
            globalThis.clearTimeout(this.stopTimer);
            this.stopTimer = null;
        }
        const resolve = this.resolveStop;
        this.resolveStop = null;
        this.recognition = null;
        resolve?.(this.finalTranscript.trim());
    }

    stop() {
        if (!this.recognition) return Promise.resolve(this.finalTranscript.trim());
        return new Promise((resolve) => {
            this.resolveStop = resolve;
            this.stopTimer = globalThis.setTimeout(() => this.finishStop(), 1800);
            try {
                this.recognition.stop();
            } catch {
                this.finishStop();
            }
        });
    }

    cancel() {
        if (this.recognition) {
            try { this.recognition.abort(); } catch {}
        }
        if (this.stopTimer !== null) {
            globalThis.clearTimeout(this.stopTimer);
            this.stopTimer = null;
        }
        const resolve = this.resolveStop;
        this.resolveStop = null;
        this.recognition = null;
        this.interimTranscript = "";
        resolve?.(this.finalTranscript.trim());
    }
}

export const speechRecognition = new SpeechRecognitionService();
