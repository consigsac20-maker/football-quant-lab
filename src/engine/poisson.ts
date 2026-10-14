import { FootballMatch, PoissonOutput, MarketEvaluation, KeyForecast } from '../types/football';

/**
 * Motor Matemático Cuantitativo de Fútbol
 * Implementación de Distribución Poisson con ajuste bivariado Dixon-Coles (1997)
 * y cálculo riguroso de probabilidades de mercado y Valor Esperado (+EV).
 */

// Factoriales precalculados para k = 0..10
const FACTORIALS = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];

export function poissonProbability(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0;
  if (k >= FACTORIALS.length) {
    // Aproximación logarítmica si supera k=10
    const logProb = k * Math.log(lambda) - lambda - logGamma(k + 1);
    return Math.exp(logProb);
  }
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / FACTORIALS[k];
}

function logGamma(n: number): number {
  let x = n;
  let f = 1;
  while (x < 7) {
    f *= x;
    x += 1;
  }
  x -= 1;
  const l = 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(x) - x;
  return l - Math.log(f);
}

/**
 * Función de ajuste de correlación de marcadores bajos según Dixon & Coles (1997)
 * tau(x, y, lambda, mu, rho)
 */
function dixonColesTau(x: number, y: number, lambda: number, mu: number, rho: number): number {
  if (x === 0 && y === 0) {
    return 1 - (lambda * mu * rho);
  } else if (x === 0 && y === 1) {
    return 1 + (lambda * rho);
  } else if (x === 1 && y === 0) {
    return 1 + (mu * rho);
  } else if (x === 1 && y === 1) {
    return 1 - rho;
  }
  return 1.0;
}

/**
 * Calcula los goles esperados (lambdas) incorporando:
 * - Fuerza ofensiva/defensiva normalizada
 * - Promedios de liga
 * - Ventaja de localía
 * - Factor contextual de altitud (si aplica, ej. Cusco / La Paz)
 */
export function calculateExpectedGoals(match: FootballMatch): { lambdaHome: number; lambdaAway: number } {
  const { homeTeam, awayTeam, leagueAverages, context } = match;

  // Ajuste contextual de altitud (alturas > 2500m reducen la eficiencia física del visitante)
  let altitudeHomeFactor = 1.0;
  let altitudeAwayPenalty = 1.0;
  if (context.altitudeMeters && context.altitudeMeters > 2500) {
    const extraKm = (context.altitudeMeters - 2000) / 1000;
    altitudeHomeFactor += 0.06 * extraKm;
    altitudeAwayPenalty -= 0.08 * extraKm;
  }

  // Factor de descanso (penaliza equipos con < 3 días de descanso)
  const homeRestFactor = homeTeam.restDays <= 3 ? 0.94 : 1.0;
  const awayRestFactor = awayTeam.restDays <= 3 ? 0.93 : 1.0;

  // Lambdas de goles
  const lambdaHomeRaw =
    homeTeam.attackStrength *
    awayTeam.defenseStrength *
    leagueAverages.avgHomeGoals *
    altitudeHomeFactor *
    homeRestFactor;

  const lambdaAwayRaw =
    awayTeam.attackStrength *
    homeTeam.defenseStrength *
    leagueAverages.avgAwayGoals *
    altitudeAwayPenalty *
    awayRestFactor;

  // Límites estadísticos para evitar valores asintóticos aberrantes
  const lambdaHome = Math.max(0.35, Math.min(4.8, Number(lambdaHomeRaw.toFixed(3))));
  const lambdaAway = Math.max(0.25, Math.min(4.5, Number(lambdaAwayRaw.toFixed(3))));

  return { lambdaHome, lambdaAway };
}

/**
 * Calcula la matriz bivariada completa y deriva todos los mercados
 */
export function calculatePoissonModel(match: FootballMatch, maxGoals: number = 7): PoissonOutput {
  const { lambdaHome, lambdaAway } = calculateExpectedGoals(match);

  // Parámetro Dixon-Coles rho típico para fútbol (-0.08 refleja correlación en marcadores 0-0 y 1-1)
  const dixonColesRho = -0.08;

  // Generación de matriz de marcadores [x][y]
  const rawMatrix: number[][] = [];
  let totalSum = 0;

  for (let x = 0; x <= maxGoals; x++) {
    rawMatrix[x] = [];
    for (let y = 0; y <= maxGoals; y++) {
      const pHome = poissonProbability(x, lambdaHome);
      const pAway = poissonProbability(y, lambdaAway);
      const tau = dixonColesTau(x, y, lambdaHome, lambdaAway, dixonColesRho);
      const prob = Math.max(0, pHome * pAway * tau);
      rawMatrix[x][y] = prob;
      totalSum += prob;
    }
  }

  // Normalización estricta para garantizar suma = 100%
  const scoreMatrix: number[][] = [];
  for (let x = 0; x <= maxGoals; x++) {
    scoreMatrix[x] = [];
    for (let y = 0; y <= maxGoals; y++) {
      scoreMatrix[x][y] = rawMatrix[x][y] / (totalSum || 1);
    }
  }

  // Derivación matemática de mercados
  let probHomeWin = 0;
  let probDraw = 0;
  let probAwayWin = 0;
  let probOver05 = 0;
  let probOver15 = 0;
  let probOver25 = 0;
  let probOver35 = 0;
  let probUnder45 = 0;
  let probBTTSYes = 0;

  const scoreList: { score: string; prob: number; homeGoals: number; awayGoals: number }[] = [];

  for (let x = 0; x <= maxGoals; x++) {
    for (let y = 0; y <= maxGoals; y++) {
      const p = scoreMatrix[x][y];
      scoreList.push({ score: `${x} - ${y}`, prob: p, homeGoals: x, awayGoals: y });

      if (x > y) probHomeWin += p;
      else if (x === y) probDraw += p;
      else probAwayWin += p;

      const totalGoals = x + y;
      if (totalGoals > 0.5) probOver05 += p;
      if (totalGoals > 1.5) probOver15 += p;
      if (totalGoals > 2.5) probOver25 += p;
      if (totalGoals > 3.5) probOver35 += p;
      if (totalGoals <= 4) probUnder45 += p;

      if (x >= 1 && y >= 1) probBTTSYes += p;
    }
  }

  // Coherencia matemática 100%
  const probUnder05 = 1 - probOver05;
  const probUnder15 = 1 - probOver15;
  const probUnder25 = 1 - probOver25;
  const probUnder35 = 1 - probOver35;
  const probOver45 = 1 - probUnder45;
  const probBTTSNo = 1 - probBTTSYes;

  // Doble oportunidad
  const prob1X = probHomeWin + probDraw;
  const probX2 = probDraw + probAwayWin;
  const prob12 = probHomeWin + probAwayWin;

  // Goles 1er Tiempo (1T): Proyección histórica ~47% de la expectativa de goles
  const lambda1H = (lambdaHome + lambdaAway) * 0.47;
  const probOver05_1H = Number(Math.max(0, Math.min(0.99, 1 - Math.exp(-lambda1H))).toFixed(4));

  // Tiros de Esquina (Córners): Modelo Poisson con base de actividad en bandas
  const expectedCorners = Number((5.1 * (match.homeTeam.attackStrength || 1.1) + 4.9 * (match.awayTeam.attackStrength || 1.05)).toFixed(2));
  let probLe7Corners = 0;
  for (let k = 0; k <= 7; k++) {
    probLe7Corners += poissonProbability(k, expectedCorners);
  }
  const probOver75Corners = Number(Math.max(0, Math.min(0.99, 1 - probLe7Corners)).toFixed(4));
  const probLe8Corners = probLe7Corners + poissonProbability(8, expectedCorners);
  const probOver85Corners = Number(Math.max(0, Math.min(0.99, 1 - probLe8Corners)).toFixed(4));

  // Top marcadores ordenados descendentemente
  scoreList.sort((a, b) => b.prob - a.prob);

  // CORRECCIÓN DE COHERENCIA DEL MARCADOR PROYECTADO:
  // Si un equipo es ampliamente superior (ej. λ_local >= λ_visita + 0.35 y P(1) >= 0.44),
  // proyectar estrictamente victoria local (ej. 2-0 o 2-1), jamás un empate incoherente 1-1.
  let projectedScore = scoreList[0] || { score: '1 - 1', prob: 0.12, homeGoals: 1, awayGoals: 1 };
  if (lambdaHome >= lambdaAway + 0.35 && probHomeWin >= 0.44) {
    if (projectedScore.homeGoals <= projectedScore.awayGoals) {
      const bestHomeWin = scoreList.find((s) => s.homeGoals > s.awayGoals);
      if (bestHomeWin) projectedScore = bestHomeWin;
    }
  } else if (lambdaAway >= lambdaHome + 0.35 && probAwayWin >= 0.44) {
    if (projectedScore.awayGoals <= projectedScore.homeGoals) {
      const bestAwayWin = scoreList.find((s) => s.awayGoals > s.homeGoals);
      if (bestAwayWin) projectedScore = bestAwayWin;
    }
  }

  // Unificación estricta de marcadores: topScores[0] SIEMPRE es el projectedScore
  const remainingScores = scoreList.filter((s) => s.score !== projectedScore.score);
  const topScores = [projectedScore, ...remainingScores.slice(0, 4)];
  const top3Scores = [projectedScore, ...remainingScores.slice(0, 2)];

  // BARRERA DURA ANTI-SESGO: UMBRAL MÍNIMO INMUTABLE DEL 80.0% PARA EL PRONÓSTICO CLAVE
  // Queda estrictamente prohibido incluir selecciones < 80.0% (descarta eventos con 70%, 75% o 77%)
  const eligibleForecasts: Array<{ label: string; prob: number; category: 'goals' | 'outcome'; priority: number }> = [];

  // 1. Doble Oportunidad Favorito (1X o X2) con P >= 80.0%
  if (prob1X >= 0.80) {
    eligibleForecasts.push({
      label: `Doble Oportunidad 1X (${match.homeTeam.shortName} o Empate)`,
      prob: prob1X,
      category: 'outcome',
      priority: 10 + prob1X,
    });
  }
  if (probX2 >= 0.80) {
    eligibleForecasts.push({
      label: `Doble Oportunidad X2 (${match.awayTeam.shortName} o Empate)`,
      prob: probX2,
      category: 'outcome',
      priority: 10 + probX2,
    });
  }

  // 2. Más de 1.5 Goles en partidos de alta cadencia goleadora con P >= 80.0%
  if (probOver15 >= 0.80) {
    eligibleForecasts.push({
      label: 'Más de 1.5 Goles',
      prob: probOver15,
      category: 'goals',
      priority: 9 + probOver15,
    });
  }

  // 3. Menos de 3.5 Goles en partidos de perfil defensivo cerrado con P >= 80.0%
  if (probUnder35 >= 0.80) {
    eligibleForecasts.push({
      label: 'Menos de 3.5 Goles',
      prob: probUnder35,
      category: 'goals',
      priority: 8 + probUnder35,
    });
  }

  // 4. Menos de 4.5 Goles en partidos tácticos con P >= 80.0%
  if (probUnder45 >= 0.80) {
    eligibleForecasts.push({
      label: 'Menos de 4.5 Goles',
      prob: probUnder45,
      category: 'goals',
      priority: 7 + probUnder45,
    });
  }

  // 5. Más de 0.5 Goles con P >= 80.0%
  if (probOver05 >= 0.80) {
    eligibleForecasts.push({
      label: 'Más de 0.5 Goles',
      prob: probOver05,
      category: 'goals',
      priority: 6 + probOver05,
    });
  }

  // 6. Victoria Directa si excepcionalmente supera 80.0%
  if (probHomeWin >= 0.80) {
    eligibleForecasts.push({
      label: `Victoria Local (${match.homeTeam.name})`,
      prob: probHomeWin,
      category: 'outcome',
      priority: 11 + probHomeWin,
    });
  }
  if (probAwayWin >= 0.80) {
    eligibleForecasts.push({
      label: `Victoria Visitante (${match.awayTeam.name})`,
      prob: probAwayWin,
      category: 'outcome',
      priority: 11 + probAwayWin,
    });
  }

  // Validación obligatoria anti-sesgo: if (selection.probability < 0.80) discard()
  const qualifiedForecasts = eligibleForecasts.filter((f) => f.prob >= 0.80);
  qualifiedForecasts.sort((a, b) => b.priority - a.priority);

  let keyForecast: KeyForecast;
  if (qualifiedForecasts.length > 0) {
    const primary = qualifiedForecasts[0];
    const secondary = qualifiedForecasts.find(
      (c) => c.category !== primary.category && c.prob >= 0.80 && c.label !== primary.label
    );
    keyForecast = {
      primary: { label: primary.label, prob: primary.prob },
      secondary: secondary ? { label: secondary.label, prob: secondary.prob } : undefined,
    };
  } else {
    keyForecast = {
      primary: {
        label: 'Abstención Cuantitativa (Sin mercado ≥80.0%)',
        prob: 0,
      },
    };
  }

  // Determinación de nivel de incertidumbre y función de abstención
  let uncertaintyLevel: PoissonOutput['uncertaintyLevel'] = 'Baja';
  let abstainReason: string | undefined;

  if (match.dataQuality.completenessScore < 60 || match.dataQuality.sampleSize < 6) {
    uncertaintyLevel = 'Abstención Recomendada';
    abstainReason = 'Datos insuficientes o tamaño muestral inferior a 6 partidos. Riesgo de sobreajuste severo.';
  } else if (match.dataQuality.completenessScore < 75 || match.dataQuality.sampleSize < 12) {
    uncertaintyLevel = 'Alta';
  } else if (match.dataQuality.completenessScore < 88) {
    uncertaintyLevel = 'Moderada';
  }

  // Evaluación de cuotas y cálculo de Valor Esperado (+EV) con auditoría estricta
  const evaluations: MarketEvaluation[] = [];
  const odds = match.odds;
  const hasRealOdds = Boolean(odds.hasRealOdds);

  // Suma de probabilidades implícitas de mercado para de-margining proporcional (solo si existen cuotas reales)
  const sum1X2 = (hasRealOdds && odds.homeWin && odds.draw && odds.awayWin)
    ? (1 / odds.homeWin) + (1 / odds.draw) + (1 / odds.awayWin)
    : 0;
  const sumOverUnder15 = (hasRealOdds && odds.over15 && odds.under15)
    ? (1 / odds.over15) + (1 / odds.under15)
    : 0;
  const sumOverUnder25 = (hasRealOdds && odds.over25 && odds.under25)
    ? (1 / odds.over25) + (1 / odds.under25)
    : 0;
  const sumBTTS = (hasRealOdds && odds.bttsYes && odds.bttsNo)
    ? (1 / odds.bttsYes) + (1 / odds.bttsNo)
    : 0;

  const marketList: Array<{
    marketName: string;
    selection: string;
    modelProb: number;
    marketOdd: number | null;
    sumOverround: number;
  }> = [
    { marketName: '1X2 (Resultado Final)', selection: '1 (Victoria Local)', modelProb: probHomeWin, marketOdd: hasRealOdds ? odds.homeWin : null, sumOverround: sum1X2 },
    { marketName: '1X2 (Resultado Final)', selection: 'X (Empate)', modelProb: probDraw, marketOdd: hasRealOdds ? odds.draw : null, sumOverround: sum1X2 },
    { marketName: '1X2 (Resultado Final)', selection: '2 (Victoria Visitante)', modelProb: probAwayWin, marketOdd: hasRealOdds ? odds.awayWin : null, sumOverround: sum1X2 },
    { marketName: 'Goles Totales', selection: 'Más de 1.5 Goles', modelProb: probOver15, marketOdd: hasRealOdds ? odds.over15 : null, sumOverround: sumOverUnder15 },
    { marketName: 'Goles Totales', selection: 'Menos de 1.5 Goles', modelProb: probUnder15, marketOdd: hasRealOdds ? odds.under15 : null, sumOverround: sumOverUnder15 },
    { marketName: 'Goles Totales', selection: 'Más de 2.5 Goles (+Goleada)', modelProb: probOver25, marketOdd: hasRealOdds ? odds.over25 : null, sumOverround: sumOverUnder25 },
    { marketName: 'Goles Totales', selection: 'Menos de 2.5 Goles', modelProb: probUnder25, marketOdd: hasRealOdds ? odds.under25 : null, sumOverround: sumOverUnder25 },
    { marketName: 'Ambos Equipos Anotan', selection: 'Ambos Anotan (Sí)', modelProb: probBTTSYes, marketOdd: hasRealOdds ? odds.bttsYes : null, sumOverround: sumBTTS },
    { marketName: 'Ambos Equipos Anotan', selection: 'Ambos Anotan (No)', modelProb: probBTTSNo, marketOdd: hasRealOdds ? odds.bttsNo : null, sumOverround: sumBTTS },
  ];

  for (const m of marketList) {
    const fairOdds = Number((1 / Math.max(0.001, m.modelProb)).toFixed(2));

    if (!hasRealOdds || m.marketOdd === null || m.marketOdd <= 1.0) {
      // Sin cuotas reales de mercado: Desactivar cálculo +EV y mostrar exclusivamente Cuota Justa
      evaluations.push({
        marketName: m.marketName,
        selection: m.selection,
        modelProbability: m.modelProb,
        fairOdds,
        marketOdds: null,
        marketImpliedProb: null,
        demarginedProb: null,
        expectedValue: null,
        expectedValuePercent: null,
        isPositiveEV: false,
        hasMarketOdds: false,
        isHighDiscrepancy: false,
        evRobustness: 'Cuota Pendiente',
      });
    } else {
      // Con cuotas reales provistas: Calcular probabilidad implícita bruta y EV matemático
      const rawImplied = 1 / m.marketOdd;
      const demargined = m.sumOverround > 0 ? rawImplied / m.sumOverround : rawImplied;
      const ev = (m.modelProb * m.marketOdd) - 1;
      const evPercent = ev * 100;
      const isPositiveEV = ev > 0.02; // Umbral conservador: > +2.0% EV

      // Alerta de discrepancia estadística alta: diferencia entre modelo y cuota > 35%
      const probDiff = Math.abs(m.modelProb - rawImplied);
      const isHighDiscrepancy = probDiff > 0.35;

      let robustness: MarketEvaluation['evRobustness'] = 'Sin Valor';
      if (isHighDiscrepancy) {
        robustness = 'Incierto';
      } else if (uncertaintyLevel === 'Abstención Recomendada') {
        robustness = 'Incierto';
      } else if (isPositiveEV) {
        if (evPercent >= 5 && uncertaintyLevel === 'Baja') {
          robustness = 'Fuerte';
        } else if (evPercent >= 2.5 && (uncertaintyLevel === 'Baja' || uncertaintyLevel === 'Moderada')) {
          robustness = 'Moderado';
        } else {
          robustness = 'Incierto';
        }
      }

      evaluations.push({
        marketName: m.marketName,
        selection: m.selection,
        modelProbability: m.modelProb,
        fairOdds,
        marketOdds: m.marketOdd,
        marketImpliedProb: rawImplied,
        demarginedProb: demargined,
        expectedValue: ev,
        expectedValuePercent: Number(evPercent.toFixed(2)),
        isPositiveEV: !isHighDiscrepancy && isPositiveEV,
        hasMarketOdds: true,
        isHighDiscrepancy,
        evRobustness: robustness,
      });
    }
  }

  return {
    lambdaHome,
    lambdaAway,
    totalExpectedGoals: Number((lambdaHome + lambdaAway).toFixed(2)),
    scoreMatrix,
    topScores,
    projectedScore,
    top3Scores,
    keyForecast,
    probHomeWin,
    probDraw,
    probAwayWin,
    probOver05,
    probUnder05,
    probOver15,
    probUnder15,
    probOver25,
    probUnder25,
    probOver35,
    probUnder35,
    probOver45,
    probUnder45,
    probBTTSYes,
    probBTTSNo,
    prob1X,
    probX2,
    prob12,
    probOver05_1H,
    probOver75Corners,
    probOver85Corners,
    expectedCorners,
    dixonColesRho,
    evaluations,
    uncertaintyLevel,
    abstainReason,
  };
}
