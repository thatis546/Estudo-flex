import { state } from "../core/state.js";
import { storage } from "../core/storage.js";
import { api } from "../core/api.js";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_STYLES = new Set(["estudo-flex-classic", "mini-traveler", "cute-cartoon", "soft-3d", "sticker", "block-avatar"]);

function readImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => resolve({ image, url, width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Não foi possível abrir a imagem."));
        };
        image.src = url;
    });
}

export function validateAvatarMetadata({ type, size, width, height } = {}) {
    if (!ALLOWED_TYPES.has(String(type || ""))) return { valid: false, reason: "Use PNG, JPEG ou WEBP." };
    if (Number(size) > MAX_FILE_SIZE) return { valid: false, reason: "O arquivo deve ter no máximo 5 MB." };
    if (Number(width) < 256 || Number(height) < 256) return { valid: false, reason: "Use uma imagem com pelo menos 256 × 256 pixels." };
    const ratio = Number(width) / Math.max(1, Number(height));
    if (ratio < 0.65 || ratio > 1.5) return { valid: false, reason: "Use um avatar individual, com enquadramento próximo de um quadrado." };
    return { valid: true, reason: "" };
}

async function detectFaces(image) {
    if (!("FaceDetector" in globalThis)) return null;
    try {
        const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        const faces = await detector.detect(image);
        return faces.length;
    } catch {
        return null;
    }
}

export async function validateAvatarFile(file) {
    if (!(file instanceof Blob)) return { valid: false, reason: "Selecione um arquivo de imagem." };
    const opened = await readImage(file);
    try {
        const metadata = validateAvatarMetadata({ type: file.type, size: file.size, width: opened.width, height: opened.height });
        if (!metadata.valid) return metadata;
        const faceCount = await detectFaces(opened.image);
        if (faceCount !== null) {
            if (faceCount === 0) return { valid: false, reason: "Nenhum rosto foi identificado no avatar." };
            if (faceCount > 1) return { valid: false, reason: "O avatar deve mostrar apenas uma pessoa ou personagem." };
        }

        let remoteValidation = null;
        try {
            const formData = new FormData();
            formData.append("avatar", file, file.name || "avatar.png");
            remoteValidation = await api("avatar/validate", { method: "POST", body: formData, timeoutMs: 30000 });
        } catch {
            throw new Error("A validação inteligente do avatar está indisponível. Tente novamente quando o backend estiver conectado.");
        }
        if (!remoteValidation || remoteValidation.valid !== true) {
            return remoteValidation || { valid: false, reason: "Não foi possível validar o avatar." };
        }
        if (remoteValidation.hasSingleFace !== true) {
            return { valid: false, reason: "O avatar precisa mostrar exatamente um rosto." };
        }
        if (remoteValidation.illustrated !== true || remoteValidation.isRealPhoto === true) {
            return { valid: false, reason: "Envie um avatar ilustrado, não uma fotografia real." };
        }
        return {
            valid: true,
            reason: "",
            partial: false,
            hasSingleFace: true,
            illustrated: true,
            isRealPhoto: false
        };
    } finally {
        URL.revokeObjectURL(opened.url);
    }
}

export async function saveUploadedAvatar(file) {
    const validation = await validateAvatarFile(file);
    if (!validation.valid) throw new Error(validation.reason);
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Não foi possível ler o avatar."));
        reader.readAsDataURL(file);
    });
    state.updateProfile({
        avatar: {
            source: "upload",
            imageUrl: String(dataUrl),
            validated: true,
            validation: { ...validation, checkedAt: new Date().toISOString() }
        }
    });
    storage.save();
    return state.profile.avatar;
}

export async function generateAvatar({ description, style = "estudo-flex-classic" } = {}) {
    const cleanDescription = String(description || "").trim();
    if (cleanDescription.length < 12) throw new Error("Descreva o avatar com um pouco mais de detalhe.");
    const safeStyle = AVATAR_STYLES.has(style) ? style : "estudo-flex-classic";
    const response = await api("avatar/generate", { method: "POST", body: { description: cleanDescription, style: safeStyle }, timeoutMs: 90000 });
    const generatedImage = response?.imageDataUrl || response?.imageUrl;
    const validation = response?.validation;
    if (!generatedImage) throw new Error("O serviço não retornou a imagem do avatar.");
    if (!validation || validation.valid !== true || validation.hasSingleFace !== true || validation.illustrated !== true || validation.isRealPhoto === true) {
        throw new Error(validation?.reason || "O avatar gerado não passou na validação de rosto e estilo ilustrado.");
    }
    state.updateProfile({
        avatar: {
            source: "generated",
            style: safeStyle,
            description: cleanDescription,
            imageUrl: generatedImage,
            validated: true,
            validation: { ...validation, checkedAt: new Date().toISOString() }
        }
    });
    storage.save();
    return state.profile.avatar;
}

export function saveAvatarDescription({ description, style = "estudo-flex-classic" } = {}) {
    state.updateProfile({ avatar: { description: String(description || "").trim(), style: AVATAR_STYLES.has(style) ? style : "estudo-flex-classic" } });
    storage.save();
    return state.profile.avatar;
}

export { AVATAR_STYLES };
