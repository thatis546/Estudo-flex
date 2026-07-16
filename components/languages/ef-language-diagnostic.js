import { router } from "../../core/router.js";
import { state } from "../../core/state.js";
import { getCurrentLanguageRecord } from "../../services/language-profile.service.js";
import { EFDiagnosticBase } from "./diagnostic-base.js";

class EFLanguageDiagnostic extends EFDiagnosticBase {
    connectedCallback() {}

    onRouteEnter() {
        const record = getCurrentLanguageRecord();
        if (!record) {
            router.navigate("languages", "replace");
            return;
        }
        if (!record.learningProfile?.goal || !record.learningProfile?.lifeContext) {
            router.navigate("language-setup", "replace");
            return;
        }
        if (record.setupComplete && record.diagnosticResult?.completedAt) {
            this.renderCompleted(record);
            return;
        }
        this.startDiagnostic(record, {
            eyebrow: "DIAGNÓSTICO DO IDIOMA",
            titlePrefix: "Descobrindo sua jornada em",
            onComplete: () => router.navigate("languages", "replace")
        });
    }

    renderCompleted(record) {
        this.innerHTML = `
            <section class="language-diagnostic-result">
                <article class="card">
                    <p class="eyebrow">DIAGNÓSTICO CONCLUÍDO</p>
                    <h1>${record.journeyLabel}</h1>
                    <p>Refaça somente quando quiser atualizar formalmente a estimativa. Alterar objetivo ou interesses não apaga este resultado.</p>
                    <div class="actions">
                        <button id="keepDiagnostic" type="button" class="primary">Manter resultado</button>
                        <button id="redoDiagnostic" type="button" class="secondary">Refazer diagnóstico</button>
                    </div>
                </article>
            </section>
        `;
        this.querySelector("#keepDiagnostic")?.addEventListener("click", () => router.navigate("languages"));
        this.querySelector("#redoDiagnostic")?.addEventListener("click", async () => {
            const { resetLanguageDiagnostic } = await import("../../services/language-profile.service.js");
            resetLanguageDiagnostic(state.currentLanguage);
            this.onRouteEnter();
        });
    }
}

if (!customElements.get("ef-language-diagnostic")) customElements.define("ef-language-diagnostic", EFLanguageDiagnostic);
