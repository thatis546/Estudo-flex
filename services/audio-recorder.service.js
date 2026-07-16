const AUDIO_CONSTRAINTS = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
};

const PREFERRED_MIME_TYPES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4"
];

export class AudioRecorderService {
    constructor() {
        this.stream = null;
        this.mediaRecorder = null;
        this.chunks = [];
    }

    isSupported() {
        return Boolean(
            globalThis.navigator?.mediaDevices?.getUserMedia &&
            globalThis.MediaRecorder
        );
    }

    isRecording() {
        return this.mediaRecorder?.state === "recording";
    }

    getStream() {
        return this.stream;
    }

    getSupportedMimeType() {
        if (!globalThis.MediaRecorder?.isTypeSupported) return "";
        return PREFERRED_MIME_TYPES.find((type) => {
            try {
                return MediaRecorder.isTypeSupported(type);
            } catch {
                return false;
            }
        }) || "";
    }

    async start() {
        if (!this.isSupported()) {
            throw new Error("A gravação de áudio não é compatível com este navegador.");
        }
        if (this.isRecording()) {
            throw new Error("Já existe uma gravação em andamento.");
        }

        this.cleanupRecorder();
        this.chunks = [];

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: AUDIO_CONSTRAINTS
            });

            const mimeType = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(
                this.stream,
                mimeType ? { mimeType } : undefined
            );

            this.mediaRecorder.addEventListener("dataavailable", (event) => {
                if (event.data?.size > 0) this.chunks.push(event.data);
            });

            this.mediaRecorder.start(250);
            return {
                mimeType: this.mediaRecorder.mimeType || mimeType || "audio/webm",
                stream: this.stream
            };
        } catch (error) {
            this.cleanupRecorder();
            throw error;
        }
    }

    stop() {
        const recorder = this.mediaRecorder;
        if (!recorder || recorder.state === "inactive") {
            return Promise.reject(new Error("Nenhuma gravação está em andamento."));
        }

        const mimeType = recorder.mimeType || this.getSupportedMimeType() || "audio/webm";
        return new Promise((resolve, reject) => {
            const finish = (callback, value) => {
                this.cleanupRecorder();
                callback(value);
            };

            recorder.addEventListener("stop", () => {
                finish(resolve, new Blob(this.chunks, { type: mimeType }));
            }, { once: true });

            recorder.addEventListener("error", (event) => {
                finish(reject, event.error || new Error("Não foi possível concluir a gravação."));
            }, { once: true });

            try {
                if (recorder.state === "recording") recorder.requestData();
                recorder.stop();
            } catch (error) {
                finish(reject, error);
            }
        });
    }

    cancel() {
        const recorder = this.mediaRecorder;
        if (!recorder || recorder.state === "inactive") {
            this.cleanupRecorder();
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            recorder.addEventListener("stop", () => {
                this.cleanupRecorder();
                resolve();
            }, { once: true });
            try {
                recorder.stop();
            } catch {
                this.cleanupRecorder();
                resolve();
            }
        });
    }

    releaseStream() {
        this.stream?.getTracks?.().forEach((track) => {
            track.stop();
        });
        this.stream = null;
    }

    cleanupRecorder() {
        this.releaseStream();
        this.mediaRecorder = null;
        this.chunks = [];
    }
}

export const audioRecorder = new AudioRecorderService();
