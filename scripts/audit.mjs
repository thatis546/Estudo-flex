import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set([".git", "node_modules"]);
const errors = [];
const warnings = [];

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (ignoredDirectories.has(entry.name)) return [];
        const fullPath = join(directory, entry.name);
        return entry.isDirectory() ? walk(fullPath) : [fullPath];
    });
}

function sourceOf(file) {
    return readFileSync(file, "utf8");
}

function stripCssNoise(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
        .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function checkExists(target, message) {
    if (!existsSync(target)) errors.push(message);
}

const files = walk(root);
const javascriptFiles = files.filter((file) => [".js", ".mjs"].includes(extname(file)));
const cssFiles = files.filter((file) => extname(file) === ".css");
const jsonFiles = files.filter((file) => extname(file) === ".json");

const importPatterns = [
    /(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']/g,
    /import\(\s*["'](\.[^"']+)["']\s*\)/g
];

for (const file of javascriptFiles) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
        errors.push(`Sintaxe inválida em ${relative(root, file)}: ${result.stderr.trim()}`);
    }

    const source = sourceOf(file);
    for (const pattern of importPatterns) {
        for (const match of source.matchAll(pattern)) {
            const target = resolve(dirname(file), match[1]);
            checkExists(target, `Import inexistente em ${relative(root, file)}: ${match[1]}`);
        }
    }

    if (relative(root, file) !== "scripts/audit.mjs" && /\|\|=|&&=|\?\?=/.test(source)) {
        errors.push(`Operador de atribuição lógica incompatível com navegadores antigos em ${relative(root, file)}.`);
    }
}

for (const file of jsonFiles) {
    try {
        JSON.parse(sourceOf(file));
    } catch (error) {
        errors.push(`JSON inválido em ${relative(root, file)}: ${error.message}`);
    }
}

for (const file of cssFiles) {
    const clean = stripCssNoise(sourceOf(file));
    let balance = 0;
    for (const character of clean) {
        if (character === "{") balance += 1;
        if (character === "}") balance -= 1;
        if (balance < 0) break;
    }
    if (balance !== 0) errors.push(`Blocos CSS desbalanceados em ${relative(root, file)}.`);

    for (const match of sourceOf(file).matchAll(/url\(\s*["']?(\.\.?\/[^"')?#]+)["']?\s*\)/g)) {
        const target = resolve(dirname(file), match[1]);
        checkExists(target, `Recurso CSS inexistente em ${relative(root, file)}: ${match[1]}`);
    }
}

const indexPath = join(root, "index.html");
const indexSource = sourceOf(indexPath);
for (const match of indexSource.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)["']/g)) {
    checkExists(resolve(root, match[1]), `Arquivo referenciado no index não existe: ${match[1]}`);
}

const manifestPath = join(root, "manifest.json");
const manifest = JSON.parse(sourceOf(manifestPath));
for (const icon of manifest.icons || []) {
    checkExists(resolve(root, icon.src), `Ícone do manifesto não existe: ${icon.src}`);
}
if (manifest.start_url?.startsWith("./")) {
    checkExists(resolve(root, manifest.start_url), `start_url do manifesto não existe: ${manifest.start_url}`);
}

const swPath = join(root, "sw.js");
const swSource = sourceOf(swPath);
for (const match of swSource.matchAll(/["']\.\/([^"']+)["']/g)) {
    checkExists(resolve(root, match[1]), `Recurso do Service Worker não existe: ./${match[1]}`);
}

const allText = files
    .filter((file) => [".js", ".css", ".html", ".json"].includes(extname(file)) && relative(root, file) !== "scripts/audit.mjs")
    .map(sourceOf)
    .join("\n");
if (/typhography/i.test(allText)) errors.push("Ainda existe referência a typhography.");

// Coleta somente módulos alcançáveis a partir do ponto de entrada do frontend.
const modulePattern = /(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g;
const activeModules = new Set();
function collectActiveModules(file) {
    const absolute = resolve(file);
    if (activeModules.has(absolute) || !existsSync(absolute)) return;
    activeModules.add(absolute);
    const source = sourceOf(absolute);
    for (const match of source.matchAll(modulePattern)) {
        collectActiveModules(resolve(dirname(absolute), match[1] || match[2]));
    }
}
collectActiveModules(join(root, "core", "app.js"));

// Verifica IDs duplicados no conjunto de componentes ativos.
const activeModuleList = [...activeModules];
const activeMarkupSources = [indexSource, ...activeModuleList.map(sourceOf)];
const idLocations = new Map();
for (const [sourceIndex, source] of activeMarkupSources.entries()) {
    for (const match of source.matchAll(/\bid=["']([^"']+)["']/g)) {
        const id = match[1];
        const location = sourceIndex === 0 ? "index.html" : relative(root, activeModuleList[sourceIndex - 1]);
        const locations = idLocations.get(id) || [];
        locations.push(location);
        idLocations.set(id, locations);
    }
}
for (const [id, locations] of idLocations) {
    if (locations.length > 1) errors.push(`ID duplicado no aplicativo ativo: ${id} (${locations.join(", ")})`);
}

// Web Components definidos, duplicados e usados.
const customElements = new Map();
for (const file of javascriptFiles) {
    const source = sourceOf(file);
    for (const match of source.matchAll(/customElements\.define\(\s*["']([^"']+)["']/g)) {
        const name = match[1];
        const previous = customElements.get(name);
        if (previous) errors.push(`Web Component duplicado: ${name} em ${relative(root, previous)} e ${relative(root, file)}`);
        else customElements.set(name, file);
    }
}
const usedCustomElements = new Set();
for (const source of activeMarkupSources) {
    for (const match of source.matchAll(/<([a-z][a-z0-9]*-[a-z0-9-]+)(?:\s|>|\/)/gi)) {
        usedCustomElements.add(match[1].toLowerCase());
    }
}
for (const name of usedCustomElements) {
    if (!customElements.has(name)) errors.push(`Web Component usado, mas não registrado: ${name}`);
}

// Rotas declaradas no roteador devem corresponder às seções do index.
const routerSource = sourceOf(join(root, "core", "router.js"));
const routeSetSource = [...routerSource.matchAll(/const\s+(?:ONBOARDING_PAGES|APP_PAGES)\s*=\s*new Set\(\[([\s\S]*?)\]\)/g)]
    .map((match) => match[1])
    .join("\n");
const declaredRoutes = new Set([...routeSetSource.matchAll(/["']([^"']+)["']/g)].map((match) => match[1]));
const indexedRoutes = new Set([...indexSource.matchAll(/data-page=["']([^"']+)["']/g)].map((match) => match[1]));
for (const route of declaredRoutes) if (!indexedRoutes.has(route)) errors.push(`Rota sem seção no index: ${route}`);
for (const route of indexedRoutes) if (!declaredRoutes.has(route)) errors.push(`Seção do index não registrada no roteador: ${route}`);

// Recursos web referenciados por componentes (src/href dinâmicos com caminho literal na raiz).
for (const file of activeModuleList) {
    const source = sourceOf(file);
    for (const match of source.matchAll(/["'`](\.\/assets\/[^"'`?#\s<]+)["'`]/g)) {
        checkExists(resolve(root, match[1]), `Asset inexistente em ${relative(root, file)}: ${match[1]}`);
    }
}

// CSS principal e seus imports.
const mainCssPath = join(root, "css", "main.css");
const mainCssSource = sourceOf(mainCssPath);
for (const match of mainCssSource.matchAll(/@import\s+["']([^"']+)["']/g)) {
    checkExists(resolve(dirname(mainCssPath), match[1]), `CSS importado não existe: ${match[1]}`);
}

// Consistência de versão entre todos os artefatos publicáveis.
const packageJson = JSON.parse(sourceOf(join(root, "package.json")));
const backendPackage = JSON.parse(sourceOf(join(root, "backend", "package.json")));
const version = packageJson.version;
if (manifest.version !== version) errors.push(`Versão divergente no manifest: ${manifest.version} ≠ ${version}`);
if (backendPackage.version !== version) errors.push(`Versão divergente no backend/package.json: ${backendPackage.version} ≠ ${version}`);
const configSource = sourceOf(join(root, "core", "config.js"));
if (!configSource.includes(`version: "${version}"`)) errors.push("core/config.js não usa a versão do pacote.");
if (!swSource.includes(`estudoflex-v${version}`)) errors.push("Service Worker não usa a versão atual no nome do cache.");
const backendServerSource = sourceOf(join(root, "backend", "src", "server.js"));
if (!backendServerSource.includes(`version: "${version}"`)) errors.push("Endpoint de saúde do backend não informa a versão atual.");

// Regras explícitas de identidade e ausência de dados pessoais de demonstração.
const welcomeSources = `${sourceOf(join(root, "components", "onboarding", "ef-welcome.js"))}\n${sourceOf(join(root, "css", "components.css"))}`;
if (welcomeSources.includes("🇺🇸")) errors.push("O Welcome ainda contém bandeira dos Estados Unidos.");
if (!welcomeSources.includes("🇧🇷")) errors.push("O Welcome não contém a identidade brasileira solicitada.");
if (/\bThamiris\b/i.test(activeMarkupSources.join("\n"))) errors.push("Ainda existe nome pessoal fixo nos componentes ativos.");

if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
}
if (warnings.length) console.warn(warnings.map((warning) => `- ${warning}`).join("\n"));
console.log(`Auditoria concluída: ${javascriptFiles.length} arquivos JS; sintaxe, imports, rotas, Web Components, CSS, assets, versões, manifesto e PWA válidos.`);
