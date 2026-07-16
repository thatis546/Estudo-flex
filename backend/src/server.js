import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { generateContent, inlinePart, parseJsonText, textPart } from "./gemini-client.js";

const app = express();
const port = Math.max(1, Number(process.env.PORT) || 3000);
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const ALLOWED_AUDIO_MIME_TYPES = new Set([
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/aac",
    "audio/ogg",
    "audio/flac"
]);
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 }
});

const mentorResponseSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        text: { type: "string" },
        memories: {
            type: "array",
            maxItems: 8,
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    text: { type: "string" },
                    category: { type: "string" },
                    source: { type: "string" },
                    languageCode: { type: "string" }
                },
                required: ["text"]
            }
        },
        achievementCandidate: {
            anyOf: [
                { type: "null" },
                {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        achievementDetected: { type: "boolean" },
                        completed: { type: "boolean" },
                        languageCode: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        sceneType: { type: "string" },
                        confidence: { type: "number", minimum: 0, maximum: 1 }
                    },
                    required: ["achievementDetected", "completed", "languageCode", "title", "description", "sceneType", "confidence"]
                }
            ]
        }
    },
    required: ["text", "memories", "achievementCandidate"]
};

const transcriptionSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        transcript: { type: "string" },
        detectedLanguage: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 }
    },
    required: ["transcript", "detectedLanguage", "confidence"]
};

const avatarValidationSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        valid: { type: "boolean" },
        hasSingleFace: { type: "boolean" },
        illustrated: { type: "boolean" },
        isRealPhoto: { type: "boolean" },
        characterCount: { type: "integer", minimum: 0, maximum: 10 },
        reason: { type: "string" }
    },
    required: ["valid", "hasSingleFace", "illustrated", "isRealPhoto", "characterCount", "reason"]
};

const achievementImageValidationSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        valid: { type: "boolean" },
        hasText: { type: "boolean" },
        hasConflictingFlag: { type: "boolean" },
        characterCount: { type: "integer", minimum: 0, maximum: 20 },
        actionMatches: { type: "boolean" },
        languageContextMatches: { type: "boolean" },
        avatarMatches: { type: "boolean" },
        reason: { type: "string" }
    },
    required: ["valid", "hasText", "hasConflictingFlag", "characterCount", "actionMatches", "languageContextMatches", "avatarMatches", "reason"]
};

const achievementDetectionSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        achievementDetected: { type: "boolean" },
        completed: { type: "boolean" },
        languageCode: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        sceneType: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 }
    },
    required: ["achievementDetected"]
};

function jsonGenerationConfig(schema, temperature = 0) {
    return {
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature
    };
}

function httpError(status, message) {
    return Object.assign(new Error(message), { status });
}

function assertMime(file, allowed, label) {
    if (!file?.buffer) throw httpError(400, `Arquivo de ${label} ausente.`);
    if (!allowed.has(String(file.mimetype || "").toLowerCase())) {
        throw httpError(415, `Formato de ${label} não suportado.`);
    }
}

function dataUrlToInlinePart(dataUrl) {
    const match = String(dataUrl || "").match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return null;
    return { inlineData: { mimeType: match[1], data: match[2] } };
}

function messagesToContents(messages = []) {
    return messages.slice(-30).map((message) => ({
        role: message.role === "assistant" || message.role === "model" ? "model" : "user",
        parts: [textPart(String(message.content || message.text || "").slice(0, 8000))]
    })).filter((content) => content.parts[0].text.trim());
}

async function validateAvatarPart(imagePart) {
    const prompt = [
        "Analise esta imagem para uso como avatar ilustrado de perfil.",
        "A imagem deve ter exatamente um personagem principal, com um rosto visível.",
        "Ela deve ser ilustração, boneco, avatar ou cartoon; fotografia real, logo, meme, paisagem, grupo e imagem sem rosto são inválidos.",
        "Preencha todos os campos do JSON e explique brevemente o motivo quando for inválida."
    ].join(" ");
    const result = await generateContent({
        kind: "multimodal",
        contents: [{ role: "user", parts: [imagePart, textPart(prompt)] }],
        generationConfig: jsonGenerationConfig(avatarValidationSchema, 0)
    });
    const data = parseJsonText(result.text) || {};
    const characterCount = Number(data.characterCount) || 0;
    const valid = data.valid === true
        && data.hasSingleFace === true
        && data.illustrated === true
        && data.isRealPhoto !== true
        && characterCount === 1;
    return {
        valid,
        hasSingleFace: data.hasSingleFace === true,
        illustrated: data.illustrated === true,
        isRealPhoto: data.isRealPhoto === true,
        characterCount,
        reason: valid ? "" : String(data.reason || "O arquivo não atende ao padrão de avatar ilustrado individual.")
    };
}

app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (!isProduction && allowedOrigins.length === 0) return callback(null, true);
        return callback(httpError(403, "Origem não autorizada."));
    }
}));
app.use(express.json({ limit: "1mb", strict: true }));

const requestWindows = new Map();
app.use((req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const limit = Math.max(10, Number(process.env.MAX_REQUESTS_PER_MINUTE) || 60);
    const current = requestWindows.get(key);
    if (!current || now - current.startedAt >= 60000) {
        requestWindows.set(key, { startedAt: now, count: 1 });
        return next();
    }
    current.count += 1;
    if (current.count > limit) return res.status(429).json({ message: "Muitas solicitações. Aguarde um minuto." });
    return next();
});
const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 120000;
    for (const [key, value] of requestWindows) {
        if (value.startedAt < cutoff) requestWindows.delete(key);
    }
}, 300000);
cleanupTimer.unref?.();

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "estudo-flex-languages", version: "0.8.2" });
});

app.post("/api/gemini", async (req, res, next) => {
    try {
        const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
        const contents = messagesToContents(messages);
        if (!contents.length) return res.status(400).json({ message: "Envie ao menos uma mensagem válida." });
        const context = req.body?.context && typeof req.body.context === "object" ? req.body.context : {};
        const safeContext = JSON.stringify(context).slice(0, 20000);
        const systemInstruction = [
            "Você é o Mentor pedagógico do Estudo Flex Languages, separado dos personagens fictícios e do Communication Lab.",
            "Responda no idioma e na jornada pedagógica indicados no contexto, com apoio em português quando autorizado.",
            "Não invente nível, conquistas, memórias, dados do usuário ou atividade concluída.",
            "Memórias só podem registrar informações pedagógicas úteis e não sensíveis que o estudante revelou ou autorizou.",
            "Só produza achievementCandidate quando a própria mensagem mais recente do estudante descrever uma ação já concluída, nunca uma intenção, seleção ou promessa.",
            `Contexto autorizado: ${safeContext}`
        ].join("\n");
        const result = await generateContent({
            contents,
            systemInstruction,
            generationConfig: jsonGenerationConfig(mentorResponseSchema, 0.6)
        });
        const structured = parseJsonText(result.text);
        if (!structured || typeof structured !== "object") throw httpError(502, "A resposta do Mentor não veio no formato esperado.");
        return res.json({
            text: String(structured.text || "").trim(),
            memories: Array.isArray(structured.memories) ? structured.memories.slice(0, 8) : [],
            achievementCandidate: structured.achievementCandidate && typeof structured.achievementCandidate === "object"
                ? structured.achievementCandidate
                : null
        });
    } catch (error) {
        next(error);
    }
});

app.post("/api/speech/transcribe", upload.single("audio"), async (req, res, next) => {
    try {
        assertMime(req.file, ALLOWED_AUDIO_MIME_TYPES, "áudio");
        const language = String(req.body?.language || "auto").slice(0, 30);
        const prompt = `Transcreva fielmente este áudio. Idioma esperado: ${language}. Não traduza, não corrija e não invente palavras. Se houver trecho ininteligível, represente-o por [inaudível].`;
        const result = await generateContent({
            kind: "multimodal",
            contents: [{ role: "user", parts: [inlinePart(req.file.buffer, req.file.mimetype), textPart(prompt)] }],
            generationConfig: jsonGenerationConfig(transcriptionSchema, 0)
        });
        const data = parseJsonText(result.text);
        if (!data || typeof data !== "object") throw httpError(502, "A transcrição não veio no formato esperado.");
        return res.json({
            transcript: String(data.transcript || "").trim(),
            detectedLanguage: String(data.detectedLanguage || language),
            confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0))
        });
    } catch (error) {
        next(error);
    }
});

app.post("/api/avatar/validate", upload.single("avatar"), async (req, res, next) => {
    try {
        assertMime(req.file, ALLOWED_IMAGE_MIME_TYPES, "avatar");
        const validation = await validateAvatarPart(inlinePart(req.file.buffer, req.file.mimetype));
        return res.status(validation.valid ? 200 : 422).json(validation);
    } catch (error) {
        next(error);
    }
});

app.post("/api/avatar/generate", async (req, res, next) => {
    try {
        const description = String(req.body?.description || "").trim().slice(0, 700);
        const style = String(req.body?.style || "estudo-flex-classic").trim().slice(0, 80);
        if (description.length < 12) return res.status(400).json({ message: "Descreva o avatar com mais detalhes." });
        const prompt = [
            `Crie um único avatar ilustrado fofo, rosto e parte superior do corpo, estilo ${style}.`,
            `Características obrigatórias: ${description}.`,
            "Fundo simples, sem texto, sem logo, sem fotografia, sem personagens adicionais, rosto completamente visível."
        ].join(" ");
        const result = await generateContent({
            kind: "image",
            contents: [{ role: "user", parts: [textPart(prompt)] }]
        });
        if (!result.imageDataUrl) throw httpError(502, "O modelo não devolveu uma imagem.");
        const generatedPart = dataUrlToInlinePart(result.imageDataUrl);
        if (!generatedPart) throw httpError(502, "A imagem gerada não pôde ser validada.");
        const validation = await validateAvatarPart(generatedPart);
        if (!validation.valid) {
            return res.status(422).json({ message: validation.reason || "O avatar gerado não passou na validação.", validation });
        }
        return res.json({ imageDataUrl: result.imageDataUrl, validation });
    } catch (error) {
        next(error);
    }
});

app.post("/api/achievement/image", async (req, res, next) => {
    try {
        const prompt = String(req.body?.prompt || "").trim().slice(0, 5000);
        const achievement = req.body?.achievement && typeof req.body.achievement === "object" ? req.body.achievement : {};
        const avatar = req.body?.avatar && typeof req.body.avatar === "object" ? req.body.avatar : {};
        if (prompt.length < 40) return res.status(400).json({ message: "Prompt de conquista incompleto." });

        const generationParts = [textPart(prompt)];
        const avatarReference = dataUrlToInlinePart(avatar.imageUrl);
        if (avatarReference) {
            generationParts.unshift(avatarReference);
            generationParts.push(textPart("A primeira imagem é a referência visual obrigatória do avatar. Preserve rosto, cabelo, tom de pele, acessórios e estilo do personagem."));
        } else if (avatar.description) {
            generationParts.push(textPart(`Características obrigatórias do avatar: ${String(avatar.description).slice(0, 600)}`));
        }

        const result = await generateContent({
            kind: "image",
            contents: [{ role: "user", parts: generationParts }]
        });
        if (!result.imageDataUrl) throw httpError(502, "O modelo não devolveu uma imagem.");

        const generatedPart = dataUrlToInlinePart(result.imageDataUrl);
        if (!generatedPart) throw httpError(502, "A ilustração gerada não pôde ser validada.");
        const validationPrompt = [
            "Valide a ilustração de uma conquista do Estudo Flex.",
            `Ação obrigatória: ${String(achievement.title || "").slice(0, 300)}.`,
            `Descrição: ${String(achievement.description || "").slice(0, 500)}.`,
            `Idioma obrigatório: ${String(achievement.language?.name || "")} (${String(achievement.language?.code || "")}).`,
            "A imagem é inválida se houver qualquer texto, letra, número ou logo; bandeira contraditória; ação incompatível; contexto de outro idioma; personagem central adicional; ou avatar sem correspondência."
        ].join(" ");
        const checked = await generateContent({
            kind: "multimodal",
            contents: [{
                role: "user",
                parts: [generatedPart, ...(avatarReference ? [avatarReference] : []), textPart(validationPrompt)]
            }],
            generationConfig: jsonGenerationConfig(achievementImageValidationSchema, 0)
        });
        const parsed = parseJsonText(checked.text) || {};
        const validation = {
            valid: parsed.valid === true,
            hasText: parsed.hasText === true,
            hasConflictingFlag: parsed.hasConflictingFlag === true,
            characterCount: Number(parsed.characterCount) || 0,
            actionMatches: parsed.actionMatches === true,
            languageContextMatches: parsed.languageContextMatches === true,
            avatarMatches: avatarReference ? parsed.avatarMatches === true : true,
            reason: String(parsed.reason || "")
        };
        const accepted = validation.valid
            && !validation.hasText
            && !validation.hasConflictingFlag
            && validation.actionMatches
            && validation.languageContextMatches
            && validation.avatarMatches;
        if (!accepted) {
            return res.status(422).json({
                message: validation.reason || "A ilustração gerada não passou na verificação de consistência.",
                validation
            });
        }

        return res.json({
            imageDataUrl: result.imageDataUrl,
            imageAlt: `Cena ilustrada da conquista ${String(achievement.title || "do estudante")}`,
            validation
        });
    } catch (error) {
        next(error);
    }
});

app.post("/api/achievements/detect", async (req, res, next) => {
    try {
        const message = String(req.body?.message || "").trim().slice(0, 8000);
        const languageCode = String(req.body?.languageCode || "").trim().toLowerCase().slice(0, 12);
        if (!message || !languageCode) return res.status(400).json({ message: "Mensagem e idioma são obrigatórios." });
        const prompt = [
            `Mensagem literal do estudante: ${JSON.stringify(message)}.`,
            `Idioma ativo: ${languageCode}.`,
            "Só existe conquista quando a mensagem narra uma ação concreta já realizada pelo estudante. Intenção, plano, desejo, seleção, simulação não concluída ou declaração vaga não contam.",
            "Quando não houver evidência suficiente, defina achievementDetected como false."
        ].join(" ");
        const result = await generateContent({
            contents: [{ role: "user", parts: [textPart(prompt)] }],
            generationConfig: jsonGenerationConfig(achievementDetectionSchema, 0)
        });
        const parsed = parseJsonText(result.text) || { achievementDetected: false };
        if (parsed.languageCode && String(parsed.languageCode).toLowerCase() !== languageCode) {
            return res.json({ achievementDetected: false });
        }
        return res.json(parsed);
    } catch (error) {
        next(error);
    }
});

app.use((error, _req, res, _next) => {
    console.error(error);
    const status = Number(error.status)
        || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
    const message = status >= 500
        ? "Não foi possível concluir a solicitação."
        : String(error.message || "Solicitação inválida.");
    res.status(status).json({ message });
});

app.listen(port, () => console.log(`Estudo Flex backend ouvindo na porta ${port}.`));
