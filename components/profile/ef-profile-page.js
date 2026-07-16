class EFProfilePage extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="profile-page" aria-labelledby="profilePageTitle">
                <header class="profile-page-header">
                    <p class="eyebrow">PERFIL VIVO</p>
                    <h1 id="profilePageTitle">Seu aprendizado sob seu controle</h1>
                    <p>Veja o que o sistema usa para personalizar cada idioma, edite interesses, avatar e memórias ou exclua seus dados.</p>
                </header>
                <ef-profile-card></ef-profile-card>
                <ef-learning-style></ef-learning-style>
                <ef-avatar-editor></ef-avatar-editor>
                <ef-privacy-controls></ef-privacy-controls>
            </section>
        `;
    }
}

if (!customElements.get("ef-profile-page")) customElements.define("ef-profile-page", EFProfilePage);
