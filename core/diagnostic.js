const LEVELS = [
    { minimumAverage: 2.5, level: 3, levelTag: "B1" },
    { minimumAverage: 1.25, level: 2, levelTag: "A2" },
    { minimumAverage: 0, level: 1, levelTag: "A1" }
];

/**
 * Avalia o diagnóstico curto do MVP.
 *
 * O teste atual tem apenas três questões introdutórias. Por isso, ele não pode
 * atribuir níveis avançados como B2, C1 ou C2 com segurança. Esses níveis devem
 * depender de um diagnóstico futuro mais amplo, com compreensão oral, escrita,
 * leitura e fala.
 */
export function evaluateShortDiagnostic(scores = [], totalQuestions = scores.length) {
    const validScores = Array.isArray(scores)
        ? scores.map(Number).filter(Number.isFinite).map((score) => Math.max(0, Math.min(3, score)))
        : [];

    const answeredQuestions = validScores.length;
    const safeTotalQuestions = Math.max(1, Number(totalQuestions) || answeredQuestions || 1);
    const totalScore = validScores.reduce((sum, score) => sum + score, 0);
    const average = answeredQuestions ? totalScore / answeredQuestions : 0;
    const answeredRatio = Math.min(1, answeredQuestions / safeTotalQuestions);
    const selectedLevel = LEVELS.find((item) => average >= item.minimumAverage) || LEVELS[LEVELS.length - 1];

    // Um diagnóstico de três perguntas deve ser apresentado como estimativa,
    // nunca como uma classificação de alta confiança.
    const confidence = Number(
        Math.min(0.7, 0.3 + answeredRatio * 0.25 + (average / 3) * 0.15).toFixed(2)
    );

    const strengths = [];
    const weaknesses = [];

    if (average >= 2.5) strengths.push("Compreensão introdutória", "Produção escrita básica");
    else if (average >= 1.25) strengths.push("Vocabulário básico");
    else strengths.push("Reconhecimento inicial de expressões");

    if (average < 2.5) weaknesses.push("Estruturas gramaticais", "Ampliação de vocabulário");
    else weaknesses.push("Fluidez e compreensão em contextos mais complexos");

    return {
        totalScore,
        average,
        answeredQuestions,
        confidence,
        level: selectedLevel.level,
        levelTag: selectedLevel.levelTag,
        strengths,
        weaknesses
    };
}
