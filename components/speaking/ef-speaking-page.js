import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { storage } from "../../core/storage.js";
import { EF_LANGUAGES } from "../../data/languages.js";
import { COMMUNICATION_MODULES, getCommunicationModule } from "../../data/communication-modules.js";
import { audioRecorder } from "../../services/audio-recorder.service.js";
import { speechRecognition } from "../../services/speech-recognition.service.js";
import { analyzeCommunication, saveCommunicationReport, transcribeCommunicationAudio } from "../../services/communication-lab.service.js";
import { isLanguageReady } from "../../services/language-profile.service.js";

const LOCALES = { en: "en-GB", fr: "fr-FR", de: "de-DE", it: "it-IT", es: "es-ES" };
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

class EFSpeakingPage extends HTMLElement {
    constructor() {
        super();
        this.selectedModule = "pronunciation";
        this.recording = false;
        this.startedAt = 0;
        this.timer = null;
        this.transcript = "";
        this.interim = "";
        this.audioBlob = null;
        this.audioUrl = "";
        this.audioContext = null;
        this.analyser = null;
        this.animationFrame = null;
        this.volumeSamples = [];
        this.sessionToken = 0;
        this.handleRouteChange = this.handleRouteChange.bind(this);
    }

    connectedCallback() {
        window.addEventListener("routechange", this.handleRouteChange);
    }

    disconnectedCallback() {
        window.removeEventListener("routechange", this.handleRouteChange);
        this.cancelSession();
    }

    onRouteEnter() {
        const record = state.getLanguage(state.currentLanguage);
        if (!record) {
            router.navigate("languages", "replace");
            return;
        }
        if (!isLanguageReady(record)) {
            router.navigate("language-setup", "replace");
            return;
        }
        this.record = record;
        this.language = EF_LANGUAGES[record.code] || record;
        this.selectedModule = record.communicationLab?.selectedModule || "pronunciation";
        this.render();
    }

    handleRouteChange(event) {
        if (event.detail?.page !== "speaking") this.cancelSession();
    }

    render() {
        const module = getCommunicationModule(this.selectedModule);
        const reports = this.record?.communicationLab?.reports || [];
        const latest = reports[0];
        this.innerHTML = `
            <section class="communication-lab-page" aria-labelledby="communicationLabTitle">
                <header class="screen-header communication-lab-header">
                    <div>
                        <p class="eyebrow">COMMUNICATION LAB</p>
                        <h1 id="communicationLabTitle">Oratória e análise técnica</h1>
                        <p>Esta área não é uma conversa com o Mentor. Ela guia módulos de pronúncia, voz, clareza, ritmo, muletas, repetição e comunicação profissional.</p>
                    </div>
                    <span class="communication-language-badge">${escapeHTML(this.language.flag || "🌍")} ${escapeHTML(this.language.name)}</span>
                </header>

                <div class="communication-module-grid" role="list" aria-label="Módulos de oratória">
                    ${COMMUNICATION_MODULES.map((item) => `
                        <button type="button" class="communication-module-card ${item.id === this.selectedModule ? "is-selected" : ""}" data-module="${item.id}" aria-pressed="${item.id === this.selectedModule}">
                            <span aria-hidden="true">${item.icon}</span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.description)}</small>
                        </button>
                    `).join("")}
                </div>

                <article class="card communication-practice-card">
                    <div class="communication-practice-heading">
                        <span class="communication-practice-icon" aria-hidden="true">${module.icon}</span>
                        <div><p class="eyebrow">EXERCÍCIO GUIADO</p><h2>${escapeHTML(module.title)}</h2><p>${escapeHTML(module.prompt)}</p></div>
                    </div>
                    <div class="communication-metrics-preview">${module.metrics.map((metric) => `<span>${escapeHTML(metric)}</span>`).join("")}</div>

                    <div class="communication-recorder" data-state="idle">
                        <div class="communication-meter" aria-label="Intensidade do microfone"><span id="communicationMeter"></span></div>
                        <p id="communicationTimer" class="communication-timer">00:00</p>
                        <p id="communicationStatus" class="communication-status" role="status">Pronto para gravar. Fale por pelo menos 20 segundos para receber um relatório útil.</p>
                        <div class="actions">
                            <button id="startCommunication" type="button" class="primary">Iniciar gravação</button>
                            <button id="stopCommunication" type="button" class="danger" disabled>Encerrar e analisar</button>
                            <button id="cancelCommunication" type="button" class="secondary" disabled>Cancelar</button>
                        </div>
                    </div>

                    <div class="communication-transcript-panel">
                        <div class="communication-panel-heading"><h3>Transcrição</h3><small>Você poderá corrigir o texto antes da análise.</small></div>
                        <textarea id="communicationTranscript" class="text-input" rows="7" placeholder="Sua fala aparecerá aqui durante ou após a gravação.">${escapeHTML(this.transcript)}</textarea>
                        <p id="communicationInterim" class="form-help">${escapeHTML(this.interim)}</p>
                    </div>
                    <audio id="communicationAudio" controls ${this.audioUrl ? `src="${escapeHTML(this.audioUrl)}"` : "hidden"}></audio>
                    <button id="reanalyzeCommunication" type="button" class="secondary full" ${this.transcript ? "" : "disabled"}>Recalcular relatório com a transcrição corrigida</button>
                </article>

                <section id="communicationReportArea">${latest ? this.reportMarkup(latest, "Último relatório salvo") : `<div class="passport-empty-state"><strong>Nenhum relatório ainda</strong><p>Conclua uma gravação para iniciar seu histórico de oratória.</p></div>`}</section>
            </section>
        `;

        this.querySelectorAll("[data-module]").forEach((button) => button.addEventListener("click", () => this.selectModule(button.dataset.module)));
        this.querySelector("#startCommunication")?.addEventListener("click", () => this.startRecording());
        this.querySelector("#stopCommunication")?.addEventListener("click", () => this.stopRecording());
        this.querySelector("#cancelCommunication")?.addEventListener("click", () => this.cancelSession());
        this.querySelector("#communicationTranscript")?.addEventListener("input", (event) => { this.transcript = event.target.value; this.updateReanalyzeButton(); });
        this.querySelector("#reanalyzeCommunication")?.addEventListener("click", () => this.analyzeAndSave({ reuseDuration: true }));
    }

    selectModule(moduleId) {
        if (this.recording) return;
        this.selectedModule = getCommunicationModule(moduleId).id;
        this.record.communicationLab.selectedModule = this.selectedModule;
        storage.save();
        this.transcript = "";
        this.interim = "";
        this.clearAudioPreview();
        this.render();
    }

    async startRecording() {
        if (this.recording) return;
        const token = ++this.sessionToken;
        this.setStatus("Solicitando acesso ao microfone...");
        try {
            const started = await audioRecorder.start();
            if (token !== this.sessionToken || router.getCurrentPage() !== "speaking") {
                await audioRecorder.cancel();
                return;
            }
            this.recording = true;
            this.startedAt = Date.now();
            this.transcript = "";
            this.interim = "";
            this.volumeSamples = [];
            this.startTimer();
            this.startMeter(started.stream);
            const recognitionStarted = speechRecognition.start({
                lang: LOCALES[this.record.code] || this.record.code,
                onUpdate: ({ final, interim }) => {
                    this.transcript = final;
                    this.interim = interim;
                    this.updateTranscriptFields();
                },
                onError: () => this.setStatus("A transcrição ao vivo foi interrompida; o áudio será enviado para transcrição ao final.")
            });
            this.updateRecorderControls(true);
            this.setStatus(recognitionStarted ? "Gravando e transcrevendo ao vivo..." : "Gravando. A transcrição será processada ao final.");
        } catch (error) {
            this.setStatus(error.message || "Não foi possível acessar o microfone.", true);
            this.updateRecorderControls(false);
        }
    }

    async stopRecording() {
        if (!this.recording) return;
        const token = this.sessionToken;
        const durationSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
        this.recording = false;
        this.stopTimer();
        this.stopMeter();
        this.updateRecorderControls(false, true);
        this.setStatus("Finalizando áudio e transcrição...");
        try {
            const [audioBlob, browserTranscript] = await Promise.all([audioRecorder.stop(), speechRecognition.stop()]);
            if (token !== this.sessionToken) return;
            if (!audioBlob || audioBlob.size === 0) throw new Error("Nenhum áudio utilizável foi capturado.");
            this.audioBlob = audioBlob;
            this.transcript = String(browserTranscript || this.transcript || "").trim();
            this.setAudioPreview(audioBlob);
            if (!this.transcript) {
                this.setStatus("Enviando o áudio para transcrição...");
                this.transcript = await transcribeCommunicationAudio(audioBlob, this.record.code);
            }
            if (!this.transcript) throw new Error("O áudio foi gravado, mas não foi possível gerar uma transcrição. Você pode digitar ou corrigir o texto manualmente.");
            this.updateTranscriptFields();
            await this.analyzeAndSave({ durationSeconds });
        } catch (error) {
            this.setStatus(error.message || "Não foi possível concluir a análise.", true);
            this.updateTranscriptFields();
            this.updateReanalyzeButton();
        } finally {
            this.updateRecorderControls(false);
        }
    }

    async analyzeAndSave({ durationSeconds = 0, reuseDuration = false } = {}) {
        const transcriptField = this.querySelector("#communicationTranscript");
        this.transcript = String(transcriptField?.value || this.transcript || "").trim();
        if (!this.transcript) {
            this.setStatus("Insira ou obtenha uma transcrição antes de analisar.", true);
            return;
        }
        const latest = this.record.communicationLab?.reports?.[0];
        const duration = reuseDuration ? Number(latest?.durationSeconds) || Math.max(20, Math.round((Date.now() - this.startedAt) / 1000)) : durationSeconds;
        const report = analyzeCommunication({
            transcript: this.transcript,
            durationSeconds: duration,
            languageCode: this.record.code,
            moduleId: this.selectedModule,
            audioMetrics: this.getAudioMetrics()
        });
        const sessionId = globalThis.crypto?.randomUUID?.() || `communication-${Date.now()}`;
        saveCommunicationReport(report, { languageCode: this.record.code, sessionId });
        const area = this.querySelector("#communicationReportArea");
        if (area) area.innerHTML = this.reportMarkup(report, "Relatório desta sessão");
        this.setStatus("Relatório concluído e salvo no Perfil Vivo.");
        this.updateReanalyzeButton();
    }

    reportMarkup(report, heading) {
        const repetitions = report.repetitions?.length ? report.repetitions.map((item) => `${escapeHTML(item.word)} (${item.count}×)`).join(" • ") : "Nenhuma repetição excessiva identificada";
        const fillers = report.fillers?.length ? report.fillers.map((item) => `${escapeHTML(item.filler)} (${item.count}×)`).join(" • ") : "Nenhuma muleta identificada na transcrição";
        return `
            <article class="card communication-report-card">
                <p class="eyebrow">${escapeHTML(heading)}</p>
                <h2>${escapeHTML(report.moduleTitle)}</h2>
                <div class="profile-stats-grid communication-report-stats">
                    <div class="stat-card"><div class="stat-details"><small>Palavras por minuto</small><strong>${Number(report.wordsPerMinute) || 0}</strong></div></div>
                    <div class="stat-card"><div class="stat-details"><small>Variedade lexical</small><strong>${Math.round((Number(report.lexicalVariety) || 0) * 100)}%</strong></div></div>
                    <div class="stat-card"><div class="stat-details"><small>Muletas</small><strong>${Number(report.fillerCount) || 0}</strong></div></div>
                    <div class="stat-card"><div class="stat-details"><small>Duração</small><strong>${Number(report.durationSeconds) || 0}s</strong></div></div>
                </div>
                <div class="communication-report-grid">
                    <div><h3>Repetições</h3><p>${repetitions}</p></div>
                    <div><h3>Muletas</h3><p>${fillers}</p></div>
                    <div><h3>Próximos exercícios</h3><ul>${(report.recommendations || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div>
                </div>
                <p class="form-help">${escapeHTML(report.pronunciationStatus || "")}</p>
            </article>
        `;
    }

    startTimer() {
        this.stopTimer();
        this.timer = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
            const seconds = String(elapsed % 60).padStart(2, "0");
            const timer = this.querySelector("#communicationTimer");
            if (timer) timer.textContent = `${minutes}:${seconds}`;
        }, 250);
    }

    stopTimer() {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
    }

    startMeter(stream) {
        try {
            this.audioContext = new AudioContext();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            const draw = () => {
                if (!this.recording || !this.analyser) return;
                this.analyser.getByteTimeDomainData(data);
                const rms = Math.sqrt(data.reduce((sum, value) => sum + Math.pow((value - 128) / 128, 2), 0) / data.length);
                const level = Math.min(100, Math.round(rms * 360));
                this.volumeSamples.push(level);
                const meter = this.querySelector("#communicationMeter");
                if (meter) meter.style.width = `${Math.max(2, level)}%`;
                this.animationFrame = requestAnimationFrame(draw);
            };
            draw();
        } catch {
            // A gravação continua mesmo sem visualização da intensidade.
        }
    }

    stopMeter() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
        this.analyser = null;
        this.audioContext?.close?.().catch(() => {});
        this.audioContext = null;
    }

    getAudioMetrics() {
        if (!this.volumeSamples.length) return { averageVolume: 0, peakVolume: 0, silenceRatio: 0 };
        const averageVolume = this.volumeSamples.reduce((sum, value) => sum + value, 0) / this.volumeSamples.length;
        const peakVolume = Math.max(...this.volumeSamples);
        const silenceRatio = this.volumeSamples.filter((value) => value < 7).length / this.volumeSamples.length;
        return { averageVolume: Number(averageVolume.toFixed(1)), peakVolume, silenceRatio: Number(silenceRatio.toFixed(2)) };
    }

    updateTranscriptFields() {
        const field = this.querySelector("#communicationTranscript");
        const interim = this.querySelector("#communicationInterim");
        if (field && document.activeElement !== field) field.value = this.transcript;
        if (interim) interim.textContent = this.interim ? `Reconhecendo: ${this.interim}` : "";
        this.updateReanalyzeButton();
    }

    updateReanalyzeButton() {
        const button = this.querySelector("#reanalyzeCommunication");
        if (button) button.disabled = !String(this.querySelector("#communicationTranscript")?.value || this.transcript).trim();
    }

    updateRecorderControls(active, processing = false) {
        const start = this.querySelector("#startCommunication");
        const stop = this.querySelector("#stopCommunication");
        const cancel = this.querySelector("#cancelCommunication");
        if (start) start.disabled = active || processing;
        if (stop) stop.disabled = !active || processing;
        if (cancel) cancel.disabled = !active;
    }

    setStatus(message, error = false) {
        const status = this.querySelector("#communicationStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("form-error", error);
    }

    setAudioPreview(blob) {
        this.clearAudioPreview();
        this.audioUrl = URL.createObjectURL(blob);
        const audio = this.querySelector("#communicationAudio");
        if (audio) {
            audio.src = this.audioUrl;
            audio.hidden = false;
        }
    }

    clearAudioPreview() {
        if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = "";
        this.audioBlob = null;
    }

    async cancelSession() {
        this.sessionToken += 1;
        this.recording = false;
        this.stopTimer();
        this.stopMeter();
        speechRecognition.cancel();
        await audioRecorder.cancel().catch(() => {});
        this.updateRecorderControls(false);
        if (router.getCurrentPage() === "speaking") this.setStatus("Gravação cancelada.");
    }
}

if (!customElements.get("ef-speaking-page")) customElements.define("ef-speaking-page", EFSpeakingPage);
