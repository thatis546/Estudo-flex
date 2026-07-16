import { state } from "../../core/state.js";
import { storage } from "../../core/storage.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { audioRecorder } from "../../services/audio-recorder.service.js";
import { router } from "../../core/router.js";

import {
    registerAchievementEvent,
    checkMetricAchievements
} from "../../services/achievement-service.js";

const MINIMUM_VALID_SESSION_SECONDS = 30;

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}

export class EFSpeakingPage extends HTMLElement {
    constructor() {
        super();

        this.session = this.createEmptySession();
        this.timerInterval = null;
        this.previewUrl = "";
        this.isBusy = false;
        this.startRequestId = 0;
        this.isPageActive = false;

        this.handleToggleConversation =
            this.handleToggleConversation.bind(this);
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
    }

    connectedCallback() {
        this.render();
        this.cacheElements();
        this.bindEvents();
        this.updateInterface("idle");
        this.isPageActive = router.getCurrentPage() === "speaking";
        window.addEventListener("routechange", this.handleRouteChange);
        window.addEventListener("language-changed", this.handleLanguageChange);
        window.addEventListener("state-updated", this.handleStateChange);
    }

    disconnectedCallback() {
        this.stopTimer();
        this.revokePreviewUrl();

        this.micButton?.removeEventListener(
            "click",
            this.handleToggleConversation
        );

        window.removeEventListener("routechange", this.handleRouteChange);
        window.removeEventListener("language-changed", this.handleLanguageChange);
        window.removeEventListener("state-updated", this.handleStateChange);
        this.startRequestId += 1;
        audioRecorder.cancel().catch(() => {});
    }



    handleLanguageChange() {
        if (this.session.isRecording || this.isBusy) return;
        this.revokePreviewUrl();
        this.render();
        this.cacheElements();
        this.bindEvents();
        this.updateInterface("idle");
    }

    handleStateChange() {
        if (this.session.isRecording || this.isBusy) return;
        const languageCode = this.resolveCurrentLanguage().code;
        const renderedLanguage = this.dataset.renderedLanguage || "";
        if (languageCode !== renderedLanguage) this.handleLanguageChange();
    }

    async handleRouteChange(event) {
        this.isPageActive = event.detail?.page === "speaking";
        if (this.isPageActive) return;

        this.startRequestId += 1;
        if (!this.session.isRecording && !this.isBusy && !audioRecorder.isRecording()) return;

        await audioRecorder.cancel().catch(() => {});
        this.stopTimer();
        this.isBusy = false;
        this.session = this.createEmptySession();
        this.updateInterface("idle", "Gravação cancelada ao sair da página.");
    }

    createEmptySession() {
        return {
            startedAt: null,
            pronunciationErrors: 0,
            isRecording: false,
            elapsedSeconds: 0,
            audioBlob: null,
            mimeType: "",
            sizeBytes: 0
        };
    }

    cacheElements() {
        this.waveform = this.querySelector(
            ".speaking-waveform-container"
        );

        this.controlPanel = this.querySelector(
            ".speaking-control-panel"
        );

        this.micButton = this.querySelector(
            ".mic-button"
        );

        this.micIcon = this.querySelector(
            '[data-field="mic-icon"]'
        );

        this.statusElement = this.querySelector(
            ".speaking-status-text"
        );

        this.timerElement = this.querySelector(
            '[data-field="conversation-timer"]'
        );

        this.errorElement = this.querySelector(
            '[data-field="pronunciation-errors"]'
        );

        this.previewWrapper = this.querySelector(
            ".speaking-recording-preview"
        );

        this.audioPreview = this.querySelector(
            '[data-field="audio-preview"]'
        );

        this.audioMetadata = this.querySelector(
            '[data-field="audio-metadata"]'
        );
    }

    bindEvents() {
        this.micButton?.addEventListener(
            "click",
            this.handleToggleConversation
        );
    }

    async handleToggleConversation() {
        if (this.isBusy) {
            return;
        }

        if (this.session.isRecording) {
            await this.endConversation();
            return;
        }

        await this.startConversation();
    }

    async startConversation() {
        if (this.session.isRecording || this.isBusy) {
            return;
        }

        const language = this.resolveCurrentLanguage();

        if (!language.code) {
            this.updateInterface(
                "error",
                "Selecione um idioma antes de iniciar."
            );

            return;
        }

        if (!audioRecorder.isSupported()) {
            this.updateInterface(
                "error",
                "Seu navegador não oferece gravação de áudio."
            );

            return;
        }

        this.isBusy = true;
        const requestId = ++this.startRequestId;
        this.updateInterface(
            "requesting",
            "Aguardando permissão do microfone…"
        );

        try {
            const recorderInfo =
                await audioRecorder.start();

            if (requestId !== this.startRequestId || !this.isPageActive) {
                await audioRecorder.cancel().catch(() => {});
                return;
            }

            this.revokePreviewUrl();
            this.hideAudioPreview();

            this.session = {
                ...this.createEmptySession(),
                startedAt: Date.now(),
                isRecording: true,
                mimeType: recorderInfo.mimeType
            };

            this.startTimer();
            this.updateErrorCounter();
            this.updateInterface("recording");
        } catch (error) {
            console.error(
                "Erro ao iniciar gravação:",
                error
            );

            this.updateInterface(
                "error",
                this.getMicrophoneErrorMessage(error)
            );
        } finally {
            this.isBusy = false;
            this.syncButtonDisabledState();
        }
    }

    async endConversation() {
        if (
            !this.session.isRecording ||
            !Number.isFinite(this.session.startedAt) ||
            this.isBusy
        ) {
            return null;
        }

        this.isBusy = true;
        this.session.isRecording = false;
        this.stopTimer();
        this.updateInterface(
            "processing",
            "Finalizando a gravação…"
        );

        try {
            const audioBlob =
                await audioRecorder.stop();

            if (!audioBlob || audioBlob.size === 0) {
                throw new Error("Nenhum áudio foi capturado.");
            }

            const elapsedSeconds = Math.max(
                0,
                Math.floor(
                    (
                        Date.now() -
                        this.session.startedAt
                    ) / 1000
                )
            );

            this.session.elapsedSeconds =
                elapsedSeconds;

            this.session.audioBlob = audioBlob;
            this.session.mimeType =
                audioBlob.type ||
                this.session.mimeType;

            this.session.sizeBytes =
                audioBlob.size;

            this.showAudioPreview(audioBlob);

            const result =
                this.processCompletedConversation(
                    elapsedSeconds,
                    audioBlob
                );

            this.dispatchAudioReadyEvent(
                audioBlob,
                result
            );

            this.updateInterface(
                "finished",
                this.createFinishedMessage(result)
            );

            return result;
        } catch (error) {
            console.error(
                "Erro ao finalizar gravação:",
                error
            );

            this.updateInterface(
                "error",
                "Não foi possível salvar esta gravação. Tente novamente."
            );

            return null;
        } finally {
            this.isBusy = false;
            this.syncButtonDisabledState();
        }
    }

    processCompletedConversation(
        elapsedSeconds,
        audioBlob
    ) {
        const language =
            this.resolveCurrentLanguage();

        if (!language.code) {
            return {
                valid: false,
                elapsedSeconds,
                totalMinutes: 0,
                unlockedAchievements: [],
                audioBlob
            };
        }

        if (
            elapsedSeconds <
            MINIMUM_VALID_SESSION_SECONDS
        ) {
            return {
                valid: false,
                elapsedSeconds,
                totalMinutes:
                    this.getConversationMinutes(
                        language.code
                    ),
                unlockedAchievements: [],
                audioBlob
            };
        }

        const languageProgress =
            this.ensureLanguageProgress(language);

        languageProgress.stats.conversationSeconds +=
            elapsedSeconds;

        languageProgress.stats.conversationsCompleted +=
            1;

        languageProgress.stats.pronunciationErrors +=
            this.session.pronunciationErrors;

        languageProgress.stats.recordedAudioBytes +=
            audioBlob.size;

        const totalMinutes = Math.floor(
            languageProgress.stats.conversationSeconds /
            60
        );

        const unlockedAchievements = [
            ...registerAchievementEvent(
                "conversation-completed",
                {
                    language,
                    metadata: {
                        elapsedSeconds,
                        audioSizeBytes: audioBlob.size,
                        mimeType: audioBlob.type
                    }
                }
            )
        ];

        if (this.session.pronunciationErrors > 0) {
            unlockedAchievements.push(
                ...registerAchievementEvent(
                    "conversation-completed-with-errors",
                    {
                        language,
                        metadata: {
                            elapsedSeconds,
                            pronunciationErrors:
                                this.session
                                    .pronunciationErrors
                        }
                    }
                )
            );
        }

        unlockedAchievements.push(
            ...checkMetricAchievements(
                "conversationMinutes",
                totalMinutes,
                {
                    language,
                    metadata: {
                        totalConversationMinutes:
                            totalMinutes
                    }
                }
            )
        );

        this.saveProgress();

        return {
            valid: true,
            elapsedSeconds,
            totalMinutes,
            pronunciationErrors:
                this.session.pronunciationErrors,
            unlockedAchievements,
            audioBlob
        };
    }

    dispatchAudioReadyEvent(audioBlob, result) {
        window.dispatchEvent(
            new CustomEvent(
                "speaking-audio-ready",
                {
                    detail: {
                        audioBlob,
                        language:
                            this.resolveCurrentLanguage(),
                        elapsedSeconds:
                            this.session.elapsedSeconds,
                        validSession:
                            Boolean(result?.valid),
                        mimeType:
                            audioBlob.type,
                        sizeBytes:
                            audioBlob.size
                    }
                }
            )
        );
    }

    onPronunciationError(errorDetails = {}) {
        if (!this.session.isRecording) {
            return;
        }

        this.session.pronunciationErrors += 1;
        this.updateErrorCounter();

        window.dispatchEvent(
            new CustomEvent(
                "speaking-pronunciation-error",
                {
                    detail: {
                        count:
                            this.session
                                .pronunciationErrors,
                        ...errorDetails
                    }
                }
            )
        );
    }

    resolveCurrentLanguage() {
        const current = state.currentLanguage;

        const rawCode =
            typeof current === "string"
                ? current
                : current?.code ||
                  current?.id ||
                  "";

        const code = String(rawCode)
            .trim()
            .toLowerCase();

        if (!code) {
            return {
                code: "",
                name: "Idioma",
                flag: "🌍",
                mentor: "Mentor de conversação"
            };
        }

        const languages = Array.isArray(
            state.languages
        )
            ? state.languages
            : [];

        const progress = languages.find(
            (language) =>
                String(
                    language.code ||
                    language.id ||
                    ""
                )
                    .trim()
                    .toLowerCase() === code
        );

        const configuration =
            EF_LANGUAGES[code] || {};

        return {
            code,
            name:
                progress?.name ||
                progress?.label ||
                configuration.name ||
                code.toUpperCase(),
            flag:
                progress?.flag ||
                configuration.flag ||
                "🌍",
            mentor:
                progress?.mentor ||
                configuration.mentor ||
                "Mentor de conversação"
        };
    }

    ensureLanguageProgress(language) {
        if (!Array.isArray(state.languages)) {
            state.languages = [];
        }

        const normalizedCode = String(
            language.code
        )
            .trim()
            .toLowerCase();

        let languageRecord =
            state.languages.find(
                (item) =>
                    String(
                        item.code ||
                        item.id ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    normalizedCode
            );

        if (!languageRecord) {
            languageRecord = {
                code: normalizedCode,
                name: language.name,
                flag: language.flag,
                mentor: language.mentor,
                level:
                    state.profile?.levelTag ||
                    "A1",
                stats: {}
            };

            state.languages.push(languageRecord);
        }

        if (!languageRecord.stats || typeof languageRecord.stats !== "object") {
            languageRecord.stats = {};
        }

        languageRecord.stats.conversationSeconds =
            this.toSafeNumber(
                languageRecord.stats
                    .conversationSeconds
            );

        languageRecord.stats.conversationsCompleted =
            this.toSafeNumber(
                languageRecord.stats
                    .conversationsCompleted
            );

        languageRecord.stats.pronunciationErrors =
            this.toSafeNumber(
                languageRecord.stats
                    .pronunciationErrors
            );

        languageRecord.stats.recordedAudioBytes =
            this.toSafeNumber(
                languageRecord.stats
                    .recordedAudioBytes
            );

        return languageRecord;
    }

    getConversationMinutes(languageCode) {
        const languages = Array.isArray(
            state.languages
        )
            ? state.languages
            : [];

        const language = languages.find(
            (item) =>
                String(
                    item.code ||
                    item.id ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                String(languageCode)
                    .trim()
                    .toLowerCase()
        );

        const seconds = this.toSafeNumber(
            language?.stats?.conversationSeconds
        );

        return Math.floor(seconds / 60);
    }

    toSafeNumber(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    saveProgress() {
        try {
            storage.save();
        } catch (error) {
            console.error(
                "Erro ao salvar o progresso de fala:",
                error
            );
        }
    }

    startTimer() {
        this.stopTimer();
        this.updateTimer(0);

        this.timerInterval = window.setInterval(
            () => {
                if (
                    !this.session.isRecording ||
                    !this.session.startedAt
                ) {
                    return;
                }

                const elapsedSeconds = Math.floor(
                    (
                        Date.now() -
                        this.session.startedAt
                    ) / 1000
                );

                this.session.elapsedSeconds =
                    elapsedSeconds;

                this.updateTimer(
                    elapsedSeconds
                );
            },
            1000
        );
    }

    stopTimer() {
        if (this.timerInterval !== null) {
            window.clearInterval(
                this.timerInterval
            );

            this.timerInterval = null;
        }
    }

    updateTimer(totalSeconds) {
        if (!this.timerElement) {
            return;
        }

        const minutes = Math.floor(
            totalSeconds / 60
        );

        const seconds = totalSeconds % 60;

        this.timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;

        this.timerElement.setAttribute(
            "datetime",
            `PT${totalSeconds}S`
        );
    }

    updateErrorCounter() {
        if (this.errorElement) {
            this.errorElement.textContent = String(
                this.session.pronunciationErrors
            );
        }
    }

    showAudioPreview(audioBlob) {
        if (!this.audioPreview) {
            return;
        }

        this.revokePreviewUrl();
        this.previewUrl = URL.createObjectURL(
            audioBlob
        );

        this.audioPreview.src = this.previewUrl;
        this.audioPreview.hidden = false;
        this.previewWrapper?.removeAttribute(
            "hidden"
        );

        if (this.audioMetadata) {
            this.audioMetadata.textContent =
                `${this.formatDuration(this.session.elapsedSeconds)} · ` +
                `${this.formatFileSize(audioBlob.size)}`;
        }
    }

    hideAudioPreview() {
        if (this.audioPreview) {
            this.audioPreview.pause();
            this.audioPreview.removeAttribute("src");
            this.audioPreview.load();
            this.audioPreview.hidden = true;
        }

        this.previewWrapper?.setAttribute(
            "hidden",
            ""
        );
    }

    revokePreviewUrl() {
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
            this.previewUrl = "";
        }
    }

    createFinishedMessage(result) {
        if (!result?.valid) {
            return (
                `Áudio gravado. Para contar no progresso, ` +
                `a sessão precisa durar pelo menos ` +
                `${MINIMUM_VALID_SESSION_SECONDS} segundos.`
            );
        }

        const sessionDuration =
            this.formatDuration(
                result.elapsedSeconds
            );

        if (
            result.unlockedAchievements.length > 0
        ) {
            return (
                `${sessionDuration} gravados. ` +
                `${result.unlockedAchievements.length} ` +
                `${result.unlockedAchievements.length === 1 ? "nova conquista desbloqueada" : "novas conquistas desbloqueadas"}.`
            );
        }

        return (
            `${sessionDuration} gravados. ` +
            `${result.totalMinutes} minutos acumulados neste idioma.`
        );
    }

    formatDuration(totalSeconds) {
        const minutes = Math.floor(
            totalSeconds / 60
        );

        const seconds = totalSeconds % 60;

        if (minutes === 0) {
            return `${seconds} segundos`;
        }

        return `${minutes} min ${seconds} s`;
    }

    formatFileSize(sizeBytes) {
        if (sizeBytes < 1024) {
            return `${sizeBytes} B`;
        }

        const kilobytes = sizeBytes / 1024;

        if (kilobytes < 1024) {
            return `${kilobytes.toFixed(1)} KB`;
        }

        return `${(kilobytes / 1024).toFixed(1)} MB`;
    }

    getMicrophoneErrorMessage(error) {
        const messages = {
            NotAllowedError:
                "Permissão do microfone negada. Autorize o acesso nas configurações do navegador.",
            PermissionDeniedError:
                "Permissão do microfone negada. Autorize o acesso nas configurações do navegador.",
            NotFoundError:
                "Nenhum microfone foi encontrado neste dispositivo.",
            DevicesNotFoundError:
                "Nenhum microfone foi encontrado neste dispositivo.",
            NotReadableError:
                "O microfone está sendo usado por outro aplicativo.",
            TrackStartError:
                "O microfone está sendo usado por outro aplicativo.",
            SecurityError:
                "A gravação exige uma conexão segura HTTPS.",
            AbortError:
                "A captura do microfone foi interrompida. Tente novamente."
        };

        return (
            messages[error?.name] ||
            error?.message ||
            "Não foi possível acessar o microfone."
        );
    }

    syncButtonDisabledState() {
        if (this.micButton) {
            this.micButton.disabled = this.isBusy;
        }
    }

    updateInterface(
        status,
        customMessage = ""
    ) {
        const isRecording =
            status === "recording";

        const isProcessing =
            status === "processing" ||
            status === "requesting";

        const hasError = status === "error";
        const isReady = status === "finished";

        this.controlPanel?.classList.toggle(
            "is-recording",
            isRecording
        );

        this.controlPanel?.classList.toggle(
            "is-processing",
            isProcessing
        );

        this.controlPanel?.classList.toggle(
            "has-error",
            hasError
        );

        this.controlPanel?.classList.toggle(
            "is-ready",
            isReady
        );

        this.waveform?.classList.toggle(
            "is-live",
            isRecording
        );

        this.waveform?.classList.toggle(
            "is-simulated",
            isProcessing
        );

        this.micButton?.classList.toggle(
            "is-recording",
            isRecording
        );

        if (this.micButton) {
            this.micButton.setAttribute(
                "aria-pressed",
                String(isRecording)
            );

            this.micButton.setAttribute(
                "aria-label",
                isRecording
                    ? "Finalizar gravação"
                    : "Iniciar gravação"
            );
        }

        if (this.micIcon) {
            this.micIcon.textContent =
                isRecording ? "⏹️" : "🎙️";
        }

        this.syncButtonDisabledState();

        if (!this.statusElement) {
            return;
        }

        if (customMessage) {
            this.statusElement.textContent =
                customMessage;
            return;
        }

        const messages = {
            idle: "Pronto para gravar",
            requesting: "Aguardando microfone…",
            recording: "Gravando sua voz…",
            processing: "Processando gravação…",
            finished: "Gravação concluída",
            error: "Não foi possível iniciar"
        };

        this.statusElement.textContent =
            messages[status] ||
            messages.idle;
    }

    render() {
        const language =
            this.resolveCurrentLanguage();

        this.dataset.renderedLanguage = language.code;
        this.innerHTML = `
            <section
                class="speaking-container"
                aria-labelledby="speakingPageTitle">

                <header class="speaking-page-header">
                    <p class="eyebrow">
                        Conversação
                    </p>

                    <h1 id="speakingPageTitle">
                        Prática de fala
                    </h1>

                    <p>
                        Grave sua voz em
                        ${escapeHTML(language.name)} e ouça o
                        resultado antes da análise automática.
                    </p>
                </header>

                <article class="speaking-mentor-stage">
                    <div class="speaking-avatar-wrapper">
                        <div
                            class="speaking-avatar"
                            role="img"
                            aria-label="${escapeHTML(language.mentor)}">
                            ${escapeHTML(language.flag)}
                        </div>
                    </div>

                    <strong>
                        ${escapeHTML(language.mentor)}
                    </strong>

                    <span class="speaking-label">
                        Tempo da sessão
                    </span>

                    <time
                        data-field="conversation-timer"
                        datetime="PT0S">
                        00:00
                    </time>
                </article>

                <article class="speaking-prompt-card">
                    <span class="speaking-label">
                        Proposta da conversa
                    </span>

                    <p class="speaking-target-text">
                        Conte algo sobre o seu dia no idioma
                        que está estudando.
                    </p>

                    <div class="speaking-analysis-text">
                        <span>
                            Análise fonética ainda não conectada
                        </span>

                        <strong
                            data-field="pronunciation-errors"
                            hidden>
                            0
                        </strong>

                        <small>
                            A gravação é feita no dispositivo. A transcrição,
                            a resposta por voz e a avaliação fonética serão
                            exibidas quando o serviço de fala estiver conectado.
                        </small>
                    </div>
                </article>

                <div
                    class="speaking-waveform-container"
                    aria-hidden="true">

                    <span class="waveform-bar"></span>
                    <span class="waveform-bar"></span>
                    <span class="waveform-bar"></span>
                    <span class="waveform-bar"></span>
                    <span class="waveform-bar"></span>
                    <span class="waveform-bar"></span>
                </div>

                <section
                    class="speaking-recording-preview"
                    hidden>

                    <span class="speaking-label">
                        Sua última gravação
                    </span>

                    <audio
                        data-field="audio-preview"
                        controls
                        preload="metadata"
                        hidden>
                    </audio>

                    <small data-field="audio-metadata"></small>
                </section>

                <div class="speaking-control-panel">
                    <button
                        type="button"
                        class="mic-button"
                        aria-label="Iniciar gravação"
                        aria-pressed="false">

                        <span
                            data-field="mic-icon"
                            aria-hidden="true">
                            🎙️
                        </span>

                        <span
                            class="mic-button-ripple"
                            aria-hidden="true">
                        </span>
                    </button>

                    <p
                        class="speaking-status-text"
                        role="status"
                        aria-live="polite">
                        Pronto para gravar
                    </p>
                </div>
            </section>
        `;
    }
}

if (!customElements.get("ef-speaking-page")) {
    customElements.define(
        "ef-speaking-page",
        EFSpeakingPage
    );
}
