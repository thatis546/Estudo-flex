import { state } from "../../core/state.js";
import { router } from "../../core/router.js";
import { allowAIMemoryRelearning, clearAIMemory, deleteEntireProfile, removeAIMemory, setAIMemoryEnabled } from "../../services/profile-privacy.service.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

class EFPrivacyControls extends HTMLElement {
    constructor() { super(); this.refresh = this.render.bind(this); }
    connectedCallback() { this.render(); window.addEventListener("state-updated", this.refresh); }
    disconnectedCallback() { window.removeEventListener("state-updated", this.refresh); }

    render() {
        const memory = state.profile.aiMemory || { enabled: true, items: [], blockedFingerprints: [] };
        this.innerHTML = `
            <section class="card profile-section-card privacy-panel" aria-labelledby="privacyTitle">
                <header class="profile-section-heading"><div><p class="eyebrow">PRIVACIDADE E CONTROLE</p><h2 id="privacyTitle">Memórias editáveis da IA</h2></div><label class="switch-row"><input id="memoryEnabled" type="checkbox" ${memory.enabled ? "checked" : ""}><span>Permitir novas memórias</span></label></header>
                <p>Você pode apagar qualquer aprendizado inferido. Ao bloquear o reaprendizado, o texto não é guardado novamente; apenas uma impressão digital não reversível evita a repetição.</p>
                <div class="ai-memory-list">
                    ${memory.items.length ? memory.items.map((item) => `
                        <article class="ai-memory-item">
                            <div><small>${escapeHTML(item.category || "contexto")} · ${escapeHTML(item.languageCode || "global")}</small><p>${escapeHTML(item.text)}</p></div>
                            <div class="ai-memory-actions">
                                <button type="button" class="secondary" data-delete-memory="${escapeHTML(item.id)}">Excluir</button>
                                <button type="button" class="secondary" data-block-memory="${escapeHTML(item.id)}">Excluir e não reaprender</button>
                            </div>
                        </article>
                    `).join("") : "<div class='passport-empty-state'><strong>Nenhuma memória registrada</strong><p>Quando o Mentor aprender algo útil, aparecerá aqui antes de ser usado no Perfil Vivo.</p></div>"}
                </div>
                <div class="actions privacy-actions">
                    <button id="clearMemories" type="button" class="secondary" ${memory.items.length ? "" : "disabled"}>Limpar memórias</button>
                    <button id="allowRelearning" type="button" class="secondary" ${memory.blockedFingerprints.length ? "" : "disabled"}>Permitir reaprendizado</button>
                    <button id="deleteProfile" type="button" class="danger">Excluir perfil e dados locais</button>
                </div>
            </section>
        `;

        this.querySelector("#memoryEnabled")?.addEventListener("change", (event) => setAIMemoryEnabled(event.target.checked));
        this.querySelectorAll("[data-delete-memory]").forEach((button) => button.addEventListener("click", async () => {
            await removeAIMemory(button.dataset.deleteMemory, { blockRelearning: false });
        }));
        this.querySelectorAll("[data-block-memory]").forEach((button) => button.addEventListener("click", async () => {
            await removeAIMemory(button.dataset.blockMemory, { blockRelearning: true });
        }));
        this.querySelector("#clearMemories")?.addEventListener("click", () => {
            if (globalThis.confirm?.("Apagar todas as memórias visíveis da IA?")) clearAIMemory({ keepBlocks: true });
        });
        this.querySelector("#allowRelearning")?.addEventListener("click", () => {
            if (globalThis.confirm?.("Permitir que informações anteriormente bloqueadas sejam aprendidas de novo?")) allowAIMemoryRelearning();
        });
        this.querySelector("#deleteProfile")?.addEventListener("click", () => {
            const confirmation = globalThis.prompt?.("Esta ação apaga todos os dados locais. Digite EXCLUIR para confirmar.");
            if (confirmation !== "EXCLUIR") return;
            deleteEntireProfile();
            router.navigate("welcome", "replace");
            globalThis.location?.reload?.();
        });
    }
}

if (!customElements.get("ef-privacy-controls")) customElements.define("ef-privacy-controls", EFPrivacyControls);
