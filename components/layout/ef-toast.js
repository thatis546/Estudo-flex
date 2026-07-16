class EFToast extends HTMLElement {
    show(message, duration = 2200) {
        this.textContent = String(message ?? "");
        this.classList.add("show");
        window.clearTimeout(this.hideTimer);
        this.hideTimer = window.setTimeout(() => this.classList.remove("show"), duration);
    }
    disconnectedCallback() {
        window.clearTimeout(this.hideTimer);
    }
}

if (!customElements.get("ef-toast")) customElements.define("ef-toast", EFToast);
