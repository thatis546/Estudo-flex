function xmlEscape(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function truncate(value, max) {
    const text = String(value ?? "").trim();
    return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
}

function formatDate(value) {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime())
        ? "Data registrada"
        : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

async function imageAsDataUrl(url) {
    if (!url) return "";
    if (/^data:image\//.test(url)) return url;
    try {
        const response = await fetch(url);
        if (!response.ok) return "";
        const blob = await response.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
}

function renderSvgToPng(svg, fileName) {
    if (typeof document === "undefined" || typeof Image === "undefined") {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        const svgBlob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        const image = new Image();
        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = 1200;
                canvas.height = 675;
                const context = canvas.getContext("2d");
                if (!context) return resolve(null);
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    resolve(blob ? new File([blob], fileName, { type: "image/png" }) : null);
                }, "image/png", 0.94);
            } catch {
                resolve(null);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        image.src = url;
    });
}

export async function buildAchievementShareFile(achievement) {
    const image = await imageAsDataUrl(achievement.illustration || achievement.avatar?.imageUrl);
    const title = xmlEscape(truncate(achievement.title, 58));
    const description = xmlEscape(truncate(achievement.description, 110));
    const languageName = xmlEscape(achievement.language?.name || "Idioma");
    const nativeName = xmlEscape(achievement.language?.nativeName || "");
    const flag = xmlEscape(achievement.language?.flag || "🌍");
    const userName = xmlEscape(truncate(achievement.userName, 34));
    const date = xmlEscape(formatDate(achievement.unlockedAt));
    const xp = Math.max(0, Number(achievement.xpEarned) || 0);
    const streak = Math.max(0, Number(achievement.streakDays) || 0);
    const media = image
        ? `<image href="${xmlEscape(image)}" x="620" y="120" width="500" height="310" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
        : `<rect x="620" y="120" width="500" height="310" rx="28" fill="#eadcc4"/><text x="870" y="290" text-anchor="middle" font-size="82">${flag}</text>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs><clipPath id="photoClip"><rect x="620" y="120" width="500" height="310" rx="28"/></clipPath></defs>
  <rect width="1200" height="675" fill="#efe2c8"/>
  <rect x="35" y="35" width="1130" height="605" rx="34" fill="#f8eedb" stroke="#7f6044" stroke-width="3" stroke-dasharray="12 9"/>
  <text x="85" y="105" font-family="Arial, sans-serif" font-size="44">${flag}</text>
  <text x="145" y="88" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#303b2c">${languageName}</text>
  <text x="145" y="116" font-family="Arial, sans-serif" font-size="19" fill="#5f604f">${nativeName}</text>
  ${media}
  <text x="85" y="218" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#52291f">${title}</text>
  <foreignObject x="85" y="250" width="485" height="155"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 27px Georgia, serif;line-height:1.35;color:#342b23;">${description}</div></foreignObject>
  <line x1="85" y1="474" x2="1115" y2="474" stroke="#b8a183" stroke-width="2"/>
  <text x="85" y="525" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#6d3d32">DATA</text>
  <text x="85" y="557" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#342b23">${date}</text>
  <text x="340" y="525" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#6d3d32">XP DA ATIVIDADE</text>
  <text x="340" y="557" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#342b23">+${xp} XP</text>
  <text x="585" y="525" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#6d3d32">SEQUÊNCIA</text>
  <text x="585" y="557" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#342b23">${streak} ${streak === 1 ? "DIA" : "DIAS"}</text>
  <text x="825" y="525" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#6d3d32">ESTUDANTE</text>
  <text x="825" y="557" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#9a3844">${userName}</text>
  <text x="85" y="608" font-family="Arial, sans-serif" font-size="20" fill="#40553d">Cada experiência leva você mais longe. • Estudo Flex Languages</text>
</svg>`;
    const safeId = String(achievement.key || achievement.id || "conquista")
        .replace(/[^a-z0-9_-]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 70) || "conquista";
    const png = await renderSvgToPng(svg, `${safeId}.png`);
    return png || new File([svg], `${safeId}.svg`, { type: "image/svg+xml" });
}

export async function shareAchievement(achievement) {
    const file = await buildAchievementShareFile(achievement);
    const payload = {
        title: achievement.title,
        text: achievement.shareMessage || `${achievement.userName} desbloqueou uma conquista no Estudo Flex Languages.`,
        files: [file]
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share(payload);
        return { shared: true, downloaded: false };
    }

    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { shared: false, downloaded: true };
}
