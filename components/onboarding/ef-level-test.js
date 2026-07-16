import { router } from "../../core/router.js";
import { state } from "../../core/state.js";
import { ensureLanguageRecord, migrateInitialProfileToCurrentLanguage } from "../../services/language-profile.service.js";
import { EFDiagnosticBase } from "../languages/diagnostic-base.js";

class EFLevelTest extends EFDiagnosticBase {
    connectedCallback() {}

    onRouteEnter() {
        const code = state.profile?.language || state.currentLanguage;
        const record = ensureLanguageRecord(code);
        if (!record) {
            router.navigate("onboarding", "replace");
            return;
        }
        state.setCurrentLanguage(record.code);
        migrateInitialProfileToCurrentLanguage();
        if (record.setupComplete && record.diagnosticResult?.completedAt) {
            router.navigate("finish", "replace");
            return;
        }
        this.startDiagnostic(record, {
            eyebrow: "PASSO FINAL DO ONBOARDING",
            titlePrefix: "Descobrindo sua jornada em",
            onComplete: () => router.navigate("finish", "replace")
        });
    }
}

if (!customElements.get("ef-level-test")) customElements.define("ef-level-test", EFLevelTest);
