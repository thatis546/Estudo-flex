export class EFPassportPage extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <section
                class="passport-container"
                aria-labelledby="passportPageTitle">

                <div class="passport-book is-open">
                    <div class="passport-book-border">
                        <header class="passport-header">
                            <span
                                class="passport-emblem"
                                aria-hidden="true">
                                🛂
                            </span>

                            <h1
                                id="passportPageTitle"
                                class="passport-title">
                                Passaporte de Idiomas
                            </h1>

                            <p class="passport-subtitle">
                                Diário internacional de aprendizagem
                            </p>
                        </header>

                        <ef-passport-card></ef-passport-card>
                        <ef-stamps></ef-stamps>
                    </div>
                </div>
            </section>

            <ef-achievements></ef-achievements>
        `;
    }
}

if (!customElements.get("ef-passport-page")) {
    customElements.define(
        "ef-passport-page",
        EFPassportPage
    );
}
