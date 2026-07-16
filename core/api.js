import { config } from "./config.js";

function isFormData(value) {
    return typeof FormData !== "undefined" && value instanceof FormData;
}

function isBinaryBody(value) {
    const isBlob = typeof Blob !== "undefined" && value instanceof Blob;
    const isArrayBuffer = typeof ArrayBuffer !== "undefined" && (
        value instanceof ArrayBuffer || ArrayBuffer.isView(value)
    );
    return isBlob || isArrayBuffer;
}

function resolveUrl(path) {
    const base = String(config.apiBase || "/api").replace(/\/$/, "");
    const suffix = String(path || "").replace(/^\//, "");
    return `${base}/${suffix}`;
}

export async function api(path, options = {}) {
    const controller = new AbortController();
    const timeoutMs = Math.max(1, Number(options.timeoutMs) || 30000);
    const timer = globalThis.setTimeout(() => controller.abort("timeout"), timeoutMs);
    const externalSignal = options.signal;
    const abort = () => controller.abort(externalSignal?.reason);

    if (externalSignal?.aborted) abort();
    else externalSignal?.addEventListener("abort", abort, { once: true });

    const {
        timeoutMs: _ignoredTimeout,
        signal: _ignoredSignal,
        headers,
        body,
        ...fetchOptions
    } = options;

    const formDataBody = isFormData(body);
    const binaryBody = isBinaryBody(body);
    const shouldSerialize = body !== undefined && body !== null &&
        typeof body === "object" && !formDataBody && !binaryBody;
    const requestBody = shouldSerialize ? JSON.stringify(body) : body;

    try {
        const response = await fetch(resolveUrl(path), {
            ...fetchOptions,
            body: requestBody,
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                ...(shouldSerialize ? { "Content-Type": "application/json" } : {}),
                ...headers
            }
        });

        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json")
            ? await response.json().catch(() => null)
            : await response.text().catch(() => "");

        if (!response.ok) {
            const message = typeof payload === "object" && payload
                ? payload.message
                : String(payload || "").trim();
            throw new Error(message || `HTTP ${response.status}`);
        }

        return payload;
    } finally {
        globalThis.clearTimeout(timer);
        externalSignal?.removeEventListener?.("abort", abort);
    }
}
