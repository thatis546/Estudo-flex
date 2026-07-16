import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules"]);
const errors = [];

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (ignoredDirectories.has(entry.name)) return [];
        const fullPath = join(directory, entry.name);
        return entry.isDirectory() ? walk(fullPath) : [fullPath];
    });
}

const files = walk(root);
const javascriptFiles = files.filter((file) => extname(file) === ".js" || extname(file) === ".mjs");

for (const file of javascriptFiles) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
        errors.push(`Sintaxe inválida em ${relative(root, file)}: ${result.stderr.trim()}`);
    }

    const source = readFileSync(file, "utf8");
    const importPatterns = [
        /(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']/g,
        /import\(\s*["'](\.[^"']+)["']\s*\)/g
    ];
    for (const pattern of importPatterns) {
        for (const match of source.matchAll(pattern)) {
            const target = resolve(dirname(file), match[1]);
            if (!existsSync(target)) {
                errors.push(`Import inexistente em ${relative(root, file)}: ${match[1]}`);
            }
        }
    }
}

const indexSource = readFileSync(join(root, "index.html"), "utf8");
for (const match of indexSource.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)["']/g)) {
    const target = resolve(root, match[1]);
    if (!existsSync(target)) errors.push(`Arquivo referenciado no index não existe: ${match[1]}`);
}

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
for (const icon of manifest.icons || []) {
    if (!existsSync(resolve(root, icon.src))) {
        errors.push(`Ícone do manifesto não existe: ${icon.src}`);
    }
}

const swSource = readFileSync(join(root, "sw.js"), "utf8");
for (const match of swSource.matchAll(/["']\.\/([^"']+)["']/g)) {
    const target = resolve(root, match[1]);
    if (!existsSync(target)) errors.push(`Recurso do Service Worker não existe: ./${match[1]}`);
}

const allText = files
    .filter((file) =>
        [".js", ".css", ".html", ".json"].includes(extname(file)) &&
        relative(root, file) !== "scripts/audit.mjs"
    )
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
if (/typhography/i.test(allText)) errors.push("Ainda existe referência a typhography.");

// Verifica IDs duplicados entre o index e os módulos realmente carregados pelo app.
const modulePattern = /(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g;
const activeModules = new Set();
function collectActiveModules(file) {
    const absolute = resolve(file);
    if (activeModules.has(absolute) || !existsSync(absolute)) return;
    activeModules.add(absolute);
    const source = readFileSync(absolute, "utf8");
    for (const match of source.matchAll(modulePattern)) {
        const specifier = match[1] || match[2];
        collectActiveModules(resolve(dirname(absolute), specifier));
    }
}
collectActiveModules(join(root, "core", "app.js"));

const activeMarkupSources = [indexSource, ...[...activeModules].map((file) => readFileSync(file, "utf8"))];
const idLocations = new Map();
for (const [sourceIndex, source] of activeMarkupSources.entries()) {
    for (const match of source.matchAll(/\bid=["']([^"']+)["']/g)) {
        const id = match[1];
        const location = sourceIndex === 0
            ? "index.html"
            : relative(root, [...activeModules][sourceIndex - 1]);
        const locations = idLocations.get(id) || [];
        locations.push(location);
        idLocations.set(id, locations);
    }
}
for (const [id, locations] of idLocations) {
    if (locations.length > 1) {
        errors.push(`ID duplicado no aplicativo ativo: ${id} (${locations.join(", ")})`);
    }
}

// Garante que todos os @import do CSS principal apontem para arquivos existentes.
const mainCssPath = join(root, "css", "main.css");
const mainCssSource = readFileSync(mainCssPath, "utf8");
for (const match of mainCssSource.matchAll(/@import\s+["']([^"']+)["']/g)) {
    const target = resolve(dirname(mainCssPath), match[1]);
    if (!existsSync(target)) errors.push(`CSS importado não existe: ${match[1]}`);
}

const customElements = new Map();
for (const file of javascriptFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/customElements\.define\(\s*["']([^"']+)["']/g)) {
        const name = match[1];
        const previous = customElements.get(name);
        if (previous) {
            errors.push(`Web Component duplicado: ${name} em ${relative(root, previous)} e ${relative(root, file)}`);
        } else {
            customElements.set(name, file);
        }
    }
}

if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
}

console.log(`Auditoria concluída: ${javascriptFiles.length} arquivos JS, imports, manifesto, PWA e referências locais válidos.`);
