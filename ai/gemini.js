import { config } from "../core/config.js";

const DEFAULT_ENDPOINT = `${String(config.apiBase || "/api").replace(/\/$/, "")}/gemini`;

export class GeminiClient {
    constructor({ endpoint = DEFAULT_ENDPOINT, timeoutMs = 30000 } = {}) {
        this.endpoint = endpoint;
        this.timeoutMs = Math.max(1, Number(timeoutMs) || 30000);
    }

    async send({ messages, context = {}, signal } = {}) {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new TypeError("messages deve ser uma lista não vazia.");
        }

        const controller = new AbortController();
        const abortFromExternalSignal = () => controller.abort(signal?.reason);
        if (signal?.aborted) abortFromExternalSignal();
        else signal?.addEventListener("abort", abortFromExternalSignal, { once: true });

        const timeout = globalThis.setTimeout(
            () => controller.abort("timeout"),
            this.timeoutMs
        );

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({ messages, context }),
                signal: controller.signal
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || `Falha na IA: HTTP ${response.status}`);
            }
            if (typeof data?.text !== "string") {
                throw new Error("Resposta inválida do backend.");
            }
            return data;
        } finally {
            globalThis.clearTimeout(timeout);
            signal?.removeEventListener?.("abort", abortFromExternalSignal);
        }
    }
}
