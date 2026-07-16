export class EFLanguagesPage extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section class="languages-page">
                <header class="languages-header">
                    <div><p class="eyebrow">Idiomas</p><h1>Minha jornada linguística</h1></div>
                </header>
                <ef-language-selector></ef-language-selector>
                <ef-language-card></ef-language-card>
            </section>
        `;
    }
}
if (!customElements.get("ef-languages-page")) customElements.define("ef-languages-page", EFLanguagesPage);
