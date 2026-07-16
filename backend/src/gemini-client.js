const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

function requireEnv(name) {
    const value = String(process.env[name] || "").trim();
    if (!value) throw Object.assign(new Error(`${name} não está configurado no backend.`), { status: 503 });
    return value;
}

function modelFor(kind) {
    if (kind === "image") return requireEnv("GEMINI_IMAGE_MODEL");
    if (kind === "multimodal") return process.env.GEMINI_MULTIMODAL_MODEL || requireEnv("GEMINI_TEXT_MODEL");
    return requireEnv("GEMINI_TEXT_MODEL");
}

function extractText(payload) {
    return (payload?.candidates || [])
        .flatMap((candidate) => candidate?.content?.parts || [])
        .map((part) => part?.text || "")
        .join("\n")
        .trim();
}

export function extractInlineImage(payload) {
    const parts = (payload?.candidates || []).flatMap((candidate) => candidate?.content?.parts || []);
    const image = parts.find((part) => part?.inlineData?.data && String(part.inlineData.mimeType || "").startsWith("image/"));
    return image?.inlineData
        ? `data:${image.inlineData.mimeType};base64,${image.inlineData.data}`
        : "";
}

export function parseJsonText(text) {
    const clean = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try { return JSON.parse(clean); } catch {
        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");
        if (start >= 0 && end > start) {
            try { return JSON.parse(clean.slice(start, end + 1)); } catch { /* noop */ }
        }
        return null;
    }
}

export async function generateContent({ kind = "text", contents, systemInstruction = "", generationConfig = {} }) {
    const key = requireEnv("GEMINI_API_KEY");
    const model = modelFor(kind);
    const url = `${API_ROOT}/${encodeURIComponent(model)}:generateContent`;
    const body = {
        contents,
        generationConfig,
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {})
    };
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key
        },
        body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.error?.message || `Falha no provedor de IA: HTTP ${response.status}`;
        throw Object.assign(new Error(message), { status: response.status >= 500 ? 502 : response.status });
    }
    return { payload, text: extractText(payload), imageDataUrl: extractInlineImage(payload) };
}

export function textPart(text) {
    return { text: String(text || "") };
}

export function inlinePart(buffer, mimeType) {
    return { inlineData: { data: buffer.toString("base64"), mimeType } };
}
