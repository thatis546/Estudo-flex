import { state } from "../../core/state.js";
import { generateAvatar, saveAvatarDescription, saveUploadedAvatar } from "../../services/avatar.service.js";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

class EFAvatarEditor extends HTMLElement {
    constructor() {
        super();
        this.refresh = this.render.bind(this);
    }

    connectedCallback() {
        this.render();
        window.addEventListener("state-updated", this.refresh);
    }

    disconnectedCallback() {
        window.removeEventListener("state-updated", this.refresh);
    }

    render() {
        const avatar = state.profile.avatar || {};
        this.innerHTML = `
            <section class="card profile-section-card avatar-editor" aria-labelledby="avatarEditorTitle">
                <header class="profile-section-heading">
                    <div><p class="eyebrow">AVATAR ILUSTRADO</p><h2 id="avatarEditorTitle">Seu bonequinho do Estudo Flex</h2></div>
                    <img class="avatar-editor-preview" src="${escapeHTML(avatar.imageUrl || "./assets/avatars/default-user.svg")}" alt="Prévia do avatar">
                </header>
                <p>O padrão do aplicativo é um avatar ilustrado. Fotos reais não são usadas nas conquistas. O arquivo enviado deve mostrar um único rosto ou personagem.</p>
                <div class="avatar-editor-grid">
                    <label><span class="slider-label">Estilo</span><select id="avatarStyle" class="text-input">
                        <option value="estudo-flex-classic" ${avatar.style === "estudo-flex-classic" ? "selected" : ""}>Estudo Flex Classic</option>
                        <option value="mini-traveler" ${avatar.style === "mini-traveler" ? "selected" : ""}>Mini Traveler</option>
                        <option value="cute-cartoon" ${avatar.style === "cute-cartoon" ? "selected" : ""}>Cute Cartoon</option>
                        <option value="soft-3d" ${avatar.style === "soft-3d" ? "selected" : ""}>3D suave</option>
                        <option value="sticker" ${avatar.style === "sticker" ? "selected" : ""}>Sticker</option>
                        <option value="block-avatar" ${avatar.style === "block-avatar" ? "selected" : ""}>Block Avatar</option>
                    </select></label>
                    <label class="avatar-description-field"><span class="slider-label">Características do avatar</span><textarea id="avatarDescription" class="text-input" rows="4" maxlength="700" placeholder="Ex.: pele morena clara, cabelo castanho escuro ondulado, brincos dourados, roupa casual e expressão alegre.">${escapeHTML(avatar.description || "")}</textarea></label>
                </div>
                <div class="actions avatar-actions">
                    <button id="saveAvatarDescription" type="button" class="secondary">Salvar descrição</button>
                    <button id="generateAvatar" type="button" class="primary">Gerar com IA</button>
                    <label class="secondary file-button">Enviar avatar ilustrado<input id="avatarUpload" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>
                </div>
                <p id="avatarStatus" class="form-help" role="status">${avatar.validation?.partial ? "Avatar aceito com validação local parcial." : avatar.validated ? "Avatar validado para uso nas conquistas." : "Avatar ainda não validado."}</p>
            </section>
        `;

        this.querySelector("#saveAvatarDescription")?.addEventListener("click", () => {
            saveAvatarDescription({ description: this.querySelector("#avatarDescription")?.value, style: this.querySelector("#avatarStyle")?.value });
            this.setStatus("Descrição salva. Ela será usada quando o serviço de geração estiver disponível.");
        });
        this.querySelector("#generateAvatar")?.addEventListener("click", () => this.handleGenerate());
        this.querySelector("#avatarUpload")?.addEventListener("change", (event) => this.handleUpload(event.target.files?.[0]));
    }

    async handleGenerate() {
        const button = this.querySelector("#generateAvatar");
        button.disabled = true;
        this.setStatus("Gerando e validando o avatar...");
        try {
            await generateAvatar({ description: this.querySelector("#avatarDescription")?.value, style: this.querySelector("#avatarStyle")?.value });
            this.setStatus("Avatar gerado e salvo.");
        } catch (error) {
            this.setStatus(error.message || "Não foi possível gerar o avatar. O backend precisa estar conectado.", true);
        } finally {
            button.disabled = false;
        }
    }

    async handleUpload(file) {
        if (!file) return;
        this.setStatus("Validando o arquivo...");
        try {
            await saveUploadedAvatar(file);
            this.setStatus("Avatar ilustrado validado e salvo.");
        } catch (error) {
            this.setStatus(error.message || "O arquivo não é compatível.", true);
        }
    }

    setStatus(message, error = false) {
        const status = this.querySelector("#avatarStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("form-error", error);
    }
}

if (!customElements.get("ef-avatar-editor")) customElements.define("ef-avatar-editor", EFAvatarEditor);
