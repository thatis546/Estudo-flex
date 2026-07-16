class EFProfilePage extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="profile-page" aria-labelledby="profilePageTitle">
                <h1 id="profilePageTitle">Perfil</h1>
                <ef-profile-card></ef-profile-card>
                <ef-learning-style></ef-learning-style>
            </section>
        `;
    }
}

if (!customElements.get("ef-profile-page")) {
    customElements.define("ef-profile-page", EFProfilePage);
}
