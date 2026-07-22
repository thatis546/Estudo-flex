import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LEARNING_STYLE_OPTIONS, ONBOARDING_FLOW, PURPOSE_OPTIONS } from "../data/onboarding.js";
import { MENTOR_ACTIVITIES } from "../services/mentor-chat.service.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("onboarding inicial usa opções, confirmação e objetivo sem pergunta redundante", async () => {
    const source = await read("components/onboarding/ef-onboarding.js");
    assert.deepEqual(ONBOARDING_FLOW, ["language", "supportMode", "goal", "contact", "dailyMinutes", "learningStyle"]);
    assert.ok(source.includes("Confirmar resposta"));
    assert.ok(!source.includes("<textarea"));
    assert.ok(!ONBOARDING_FLOW.includes("lifeContext"));
    assert.ok(PURPOSE_OPTIONS.every((item) => item.goalDescription && item.useCase && item.lifeContext));
});

test("estudante pode deixar estilo e interesses para o Perfil Vivo descobrir", async () => {
    const goals = await read("components/onboarding/ef-goals.js");
    assert.ok(LEARNING_STYLE_OPTIONS.some((item) => item.value === "discover"));
    assert.ok(goals.includes("Descobrir meus interesses aos poucos"));
    assert.ok(!goals.includes('id="goalDescription"'));
    assert.ok(!goals.includes('id="useCase"'));
});

test("resultado do diagnóstico não exibe confiança nem contagem de evidências", async () => {
    const source = await read("components/languages/diagnostic-base.js");
    assert.ok(!source.includes("Confiança inicial"));
    assert.ok(!source.includes("Evidências respondidas"));
    assert.ok(source.includes("estimativa de partida"));
});

test("Mentor oferece atividades e descrição de imagem separada do Communication Lab", async () => {
    const server = await read("backend/src/server.js");
    assert.ok(MENTOR_ACTIVITIES.some((item) => item.id === "image"));
    assert.ok(MENTOR_ACTIVITIES.some((item) => item.id === "correct"));
    assert.ok(server.includes('/api/mentor/image-description') || server.includes('\"/api/mentor/image-description\"'));
});

test("folha v0.9.0 corrige layouts internos sem depender da largura da janela", async () => {
    const main = await read("css/main.css");
    const css = await read("css/v090.css");
    assert.ok(main.includes('@import ' + '"./v090.css"'));
    assert.ok(css.includes(".professional-study-layout { grid-template-columns: 1fr !important; }"));
    assert.ok(css.includes(".avatar-editor-grid { grid-template-columns: 1fr !important; }"));
    assert.ok(css.includes(".achievement-card__hero { grid-template-columns: 1fr !important;"));
    assert.ok(css.includes(".onboarding-chat-scroll"));
});

test("continuar depois direciona para a Home e o retorno aos objetivos preserva a etapa anterior", async () => {
    const onboarding = await read("components/onboarding/ef-onboarding.js");
    const goals = await read("components/onboarding/ef-goals.js");
    const router = await read("core/router.js");
    assert.ok(onboarding.includes('router.navigate("home")'));
    assert.ok(router.includes('state.profile?.onboardingProgress?.paused'));
    assert.ok(goals.includes("step: 5"));
});

test("conclusão usa tempo, frequência, interesses e finalidade salvos", async () => {
    const finish = await read("components/onboarding/ef-finish.js");
    assert.ok(finish.includes("learningProfile.dailyMinutes"));
    assert.ok(finish.includes("details.frequency"));
    assert.ok(finish.includes("details.interests"));
    assert.ok(finish.includes("getPurposeSummary"));
    assert.ok(!finish.includes("Temas variados"));
    assert.ok(!finish.includes("A definir"));
});

test("Perfil Vivo usa a mesma finalidade do perfil independente do idioma", async () => {
    const card = await read("components/profile/ef-profile-card.js");
    const learning = await read("components/profile/ef-learning-style.js");
    assert.ok(card.includes("getPurposeSummary"));
    assert.ok(card.includes("learningProfile"));
    assert.ok(learning.includes("getLearningStyleLabel"));
});

test("diagnóstico distribui respostas corretas e não usa a opção mais longa como regra", async () => {
    const { DIAGNOSTIC_BANK } = await import("../data/diagnostic-bank.js");
    for (const questions of Object.values(DIAGNOSTIC_BANK)) {
        const choices = questions.filter((question) => question.type === "choice");
        const correctPositions = new Set();
        let longestIsWrong = false;
        for (const question of choices) {
            const correctIndex = question.options.findIndex(([, score]) => score === 4);
            correctPositions.add(correctIndex);
            const longestIndex = question.options
                .map(([label], index) => ({ index, length: label.length }))
                .sort((a, b) => b.length - a.length)[0].index;
            if (longestIndex !== correctIndex) longestIsWrong = true;
        }
        assert.ok(correctPositions.size >= 2);
        assert.equal(longestIsWrong, true);
    }
});

test("Communication Lab e Mentor continuam em rotas e componentes distintos", async () => {
    const index = await read("index.html");
    const navbar = await read("components/layout/ef-navbar.js");
    assert.ok(index.includes('data-page="mentor"'));
    assert.ok(index.includes('data-page="speaking"'));
    assert.ok(navbar.includes('data-route="mentor"'));
    assert.ok(navbar.includes('data-route="speaking"'));
});

test("passo 2 móvel mantém rolagem, ações alcançáveis e não rerenderiza a página ao marcar interesse", async () => {
    const goals = await read("components/onboarding/ef-goals.js");
    const css = await read("css/v091.css");
    assert.ok(goals.includes("this.updateInterestControls()"));
    assert.ok(!goals.includes("else this.selectedInterests.add(interest);\n                this.render();"));
    assert.ok(css.includes(".goals-actions"));
    assert.ok(css.includes("position: sticky"));
    assert.ok(css.includes("height: 100dvh"));
    assert.ok(css.includes(".goals-page fieldset.mentor-section"));
});

test("tempo, frequência e interesses são sincronizados para o registro independente do idioma", async () => {
    const goals = await read("components/onboarding/ef-goals.js");
    const onboarding = await read("components/onboarding/ef-onboarding.js");
    const finish = await read("components/onboarding/ef-finish.js");
    assert.ok(goals.includes("migrateInitialProfileToCurrentLanguage"));
    assert.ok(onboarding.includes("migrateInitialProfileToCurrentLanguage"));
    assert.ok(finish.includes("getEffectiveLearningProfile"));
    assert.ok(finish.includes("migrateInitialProfileToCurrentLanguage"));
});

test("Home bloqueia revisão antes da primeira atividade", async () => {
    const home = await read("components/home/ef-home-page.js");
    const review = await read("components/review/ef-review-page.js");
    assert.ok(home.includes("Inicie uma atividade antes da revisão"));
    assert.ok(home.includes('router.navigate("lesson")'));
    assert.ok(review.includes("A revisão ainda não foi liberada"));
    assert.ok(review.includes("sourceActivityTitle"));
});
