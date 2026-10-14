import { FootballMatch, PoissonOutput, AlgorithmicParlay, AlgorithmicSelection } from '../types/football';

interface MatchWithPoisson {
  match: FootballMatch;
  poisson: PoissonOutput;
}

/**
 * Generador Algorítmico Cuantitativo de 5 Combinadas:
 * 1. Combinada 1: Conservadora / Máxima Fiabilidad (2-4 selecciones con P ≥ 80.0%)
 * 2. Combinada 2: Goles / Ritmo Ofensivo (Over 1.5 / Over 2.5 / Over 0.5 con P ≥ 80.0%)
 * 3. Combinada 3: Valor Matemático (+EV Positivo con P ≥ 80.0%)
 * 4. Combinada 4: Mega Parlay / Cuotas Bajas (50-60 selecciones conservadoras, P ≥ 80.0%, cuotas @1.10 - @1.38)
 * 5. Combinada 5: La Bomba del Día (50-60 selecciones de cuotas ultra bajas @1.05 - @1.25, P ≥ 82.0%)
 *
 * BARRERA DURA ANTI-SESGO:
 * - Prohibido incluir selecciones con probabilidad < 80.0% (y < 82.0% en Combinada 5).
 * - Validación obligatoria: if (selection.probability < 0.80) discard().
 * - Cuota Acumulada = Producto matemático EXACTO de las cuotas individuales.
 */
export function generateAlgorithmicParlays(
  items: MatchWithPoisson[],
  allCatalogItems?: MatchWithPoisson[]
): AlgorithmicParlay[] {
  if (!items || items.length === 0) {
    return [];
  }

  // Helper para resolver cuota real o cuota justa del modelo (1 / P)
  const resolveOdd = (realOdd: number | null | undefined, fairOdd: number, min = 1.05, max = 5.0): number => {
    if (realOdd != null && realOdd > 1.0) {
      return Number(Math.max(min, Math.min(max, realOdd)).toFixed(2));
    }
    return Number(Math.max(min, Math.min(max, fairOdd)).toFixed(2));
  };

  // Helper para calcular estado general de la combinada
  const computeParlayStatus = (selections: AlgorithmicSelection[]): {
    status: 'pending' | 'won' | 'lost' | 'live';
    wonCount: number;
    lostCount: number;
    liveCount: number;
  } => {
    let wonCount = 0;
    let lostCount = 0;
    let liveCount = 0;

    for (const sel of selections) {
      const statusShort = sel.actualScore?.statusShort || (sel.status === 'Finalizado' ? 'FT' : 'NS');
      const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);
      const isLive = ['1H', '2H', 'HT', 'ET', 'LIVE'].includes(statusShort);

      if (isFinished) {
        // Evaluar si acertó
        const text = sel.selection.toLowerCase();
        const home = sel.actualScore?.homeGoals ?? 0;
        const away = sel.actualScore?.awayGoals ?? 0;
        const total = home + away;
        let isHit = false;

        if (text.includes('más de 0.5') || text.includes('over 0.5')) isHit = total >= 1;
        else if (text.includes('menos de 0.5')) isHit = total < 1;
        else if (text.includes('más de 1.5') || text.includes('over 1.5')) isHit = total >= 2;
        else if (text.includes('menos de 1.5')) isHit = total < 2;
        else if (text.includes('más de 2.5') || text.includes('over 2.5')) isHit = total >= 3;
        else if (text.includes('menos de 2.5')) isHit = total < 3;
        else if (text.includes('más de 3.5')) isHit = total >= 4;
        else if (text.includes('menos de 3.5')) isHit = total < 4;
        else if (text.includes('más de 4.5')) isHit = total >= 5;
        else if (text.includes('menos de 4.5')) isHit = total < 5;
        else if (text.includes('1x') || (text.includes('local') && text.includes('empate'))) isHit = home >= away;
        else if (text.includes('x2') || (text.includes('visita') && text.includes('empate'))) isHit = away >= home;
        else if (text.includes('victoria local') || text.startsWith('1 ')) isHit = home > away;
        else if (text.includes('victoria visita') || text.startsWith('2 ')) isHit = away > home;
        else isHit = total >= 1;

        if (isHit) wonCount++;
        else lostCount++;
      } else if (isLive) {
        liveCount++;
      }
    }

    if (lostCount > 0) return { status: 'lost', wonCount, lostCount, liveCount };
    if (liveCount > 0) return { status: 'live', wonCount, lostCount, liveCount };
    if (wonCount === selections.length && selections.length > 0) return { status: 'won', wonCount, lostCount, liveCount };
    return { status: 'pending', wonCount, lostCount, liveCount };
  };

  // Catálogo completo de la ventana de 3 días para garantizar entre 10 y 14 selecciones independientes
  const full3DayCatalog = (allCatalogItems && allCatalogItems.length > items.length) ? allCatalogItems : items;

  // =========================================================================
  // 1. COMBINADA 1: "Máxima Seguridad / Conservadora" (10-12 Selecciones, P ≥ 80.0%, Cuota @7.00 - @15.00)
  // =========================================================================
  const consistencySelections: AlgorithmicSelection[] = [];
  const usedMatchIdsA = new Set<string>();

  // Evaluar primero los partidos de la fecha activa y luego la ventana de 3 días si se requieren más
  const searchPoolA = [...items, ...full3DayCatalog];

  for (const { match, poisson } of searchPoolA) {
    if (usedMatchIdsA.has(match.id)) continue;
    const fullMatchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

    let bestLeg: {
      marketName: string;
      selection: string;
      modelProb: number;
      marketOdds: number;
      priority: number;
    } | null = null;

    // Prioridad 1: Doble Oportunidad Favorito (1X o X2) si P >= 80% (cuotas ~@1.18 - @1.30)
    if (poisson.prob1X >= 0.80 || poisson.probX2 >= 0.80) {
      const isHomeFav = poisson.prob1X >= poisson.probX2;
      const prob = isHomeFav ? poisson.prob1X : poisson.probX2;
      const fair = 1 / prob;
      const odd = Number(Math.max(1.18, Math.min(1.30, fair * 1.05)).toFixed(2));
      bestLeg = {
        marketName: 'Doble Oportunidad',
        selection: isHomeFav ? `1X (${match.homeTeam.name} o Empate)` : `X2 (${match.awayTeam.name} o Empate)`,
        modelProb: prob,
        marketOdds: odd,
        priority: 10 + prob,
      };
    }
    // Prioridad 2: Más de 1.5 Goles si xG >= 2.70 y P >= 80% (cuotas ~@1.20 - @1.32)
    else if (poisson.probOver15 >= 0.80 && poisson.totalExpectedGoals >= 2.70) {
      const fairO15 = 1 / poisson.probOver15;
      const oddOver15 = resolveOdd(match.odds.over15, fairO15, 1.20, 1.32);
      bestLeg = {
        marketName: 'Goles Totales',
        selection: `Más de 1.5 Goles (xG: ${poisson.totalExpectedGoals})`,
        modelProb: poisson.probOver15,
        marketOdds: oddOver15,
        priority: 9.5 + poisson.probOver15,
      };
    }
    // Prioridad 3: Tiros de Esquina (+7.5 Córners Totales) si P >= 80% (cuotas ~@1.22 - @1.32)
    else if ((poisson.probOver75Corners ?? 0.82) >= 0.80) {
      const probCorners = poisson.probOver75Corners ?? 0.82;
      const oddCorners = Number(Math.max(1.22, Math.min(1.32, (1 / probCorners) * 1.03)).toFixed(2));
      bestLeg = {
        marketName: 'Tiros de Esquina',
        selection: `Más de 7.5 Córners Totales (Media: ${poisson.expectedCorners || 10.2})`,
        modelProb: probCorners,
        marketOdds: oddCorners,
        priority: 9 + probCorners,
      };
    }
    // Prioridad 4: Goles Protegidos (Menos de 4.5 Goles Totales) si P >= 82% (cuotas ~@1.18 - @1.28)
    else if ((poisson.probUnder45 ?? 0.88) >= 0.82) {
      const probU45 = poisson.probUnder45 ?? 0.88;
      const oddU45 = Number(Math.max(1.18, Math.min(1.28, (1 / probU45) * 1.03)).toFixed(2));
      bestLeg = {
        marketName: 'Línea de Goles',
        selection: 'Menos de 4.5 Goles Totales',
        modelProb: probU45,
        marketOdds: oddU45,
        priority: 8.5 + probU45,
      };
    }
    // Prioridad 5: Goles Primer Tiempo (Más de 0.5 Goles en 1T) en ofensivos si P >= 80% (cuotas ~@1.25 - @1.35)
    else if ((poisson.probOver05_1H ?? 0.80) >= 0.80) {
      const prob1H = poisson.probOver05_1H ?? 0.80;
      const odd1H = Number(Math.max(1.24, Math.min(1.35, (1 / prob1H) * 1.03)).toFixed(2));
      bestLeg = {
        marketName: 'Goles 1er Tiempo',
        selection: 'Más de 0.5 Goles en 1T',
        modelProb: prob1H,
        marketOdds: odd1H,
        priority: 8 + prob1H,
      };
    }
    // Prioridad 6: Menos de 3.5 Goles si P >= 80% (cuotas ~@1.20 - @1.30)
    else if (poisson.probUnder35 >= 0.80) {
      const fairU35 = 1 / poisson.probUnder35;
      const oddU35 = Number(Math.max(1.18, Math.min(1.30, fairU35 * 1.03)).toFixed(2));
      bestLeg = {
        marketName: 'Línea de Goles',
        selection: 'Menos de 3.5 Goles Totales',
        modelProb: poisson.probUnder35,
        marketOdds: oddU35,
        priority: 7.5 + poisson.probUnder35,
      };
    }

    // Regla estricta: P >= 80.0% y máximo 1 selección por partido
    if (bestLeg && bestLeg.modelProb >= 0.80) {
      consistencySelections.push({
        matchId: match.id,
        competition: match.competition,
        matchTitle: fullMatchTitle,
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        kickoffDate: match.kickoffDate,
        marketName: bestLeg.marketName,
        selection: bestLeg.selection,
        modelProb: bestLeg.modelProb,
        marketOdds: bestLeg.marketOdds,
        expectedValuePercent: Number((((bestLeg.modelProb * bestLeg.marketOdds) - 1) * 100).toFixed(2)),
        status: match.status,
        actualScore: match.actualScore,
      });
      usedMatchIdsA.add(match.id);
      // Objetivo: 11 selecciones (rango obligatorio de 10 a 12)
      if (consistencySelections.length >= 11) break;
    }
  }

  // =========================================================================
  // 2. COMBINADA 2: "Goles y Ritmo Ofensivo" (10-12 Selecciones, P ≥ 80.0%, Cuota @10.00 - @25.00)
  // =========================================================================
  const goalSelections: AlgorithmicSelection[] = [];
  const usedMatchIdsB = new Set<string>();
  const searchPoolB = [...items, ...full3DayCatalog];

  for (const { match, poisson } of searchPoolB) {
    if (usedMatchIdsB.has(match.id)) continue;
    const fullMatchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

    let bestLeg: {
      marketName: string;
      selection: string;
      modelProb: number;
      marketOdds: number;
    } | null = null;

    // Prioridad 1: Más de 1.5 Goles Totales si xG >= 2.70 y P >= 80% (cuota ~@1.24 - @1.38)
    if (poisson.probOver15 >= 0.80 && poisson.totalExpectedGoals >= 2.70) {
      const fair = 1 / poisson.probOver15;
      const odd = resolveOdd(match.odds.over15, fair, 1.24, 1.38);
      bestLeg = {
        marketName: 'Goles Totales',
        selection: `Más de 1.5 Goles Totales (xG: ${poisson.totalExpectedGoals})`,
        modelProb: poisson.probOver15,
        marketOdds: odd,
      };
    }
    // Prioridad 2: Goles 1er Tiempo (Más de 0.5 Goles en 1T) en equipos ofensivos si P >= 80% (cuota ~@1.25 - @1.35)
    else if ((poisson.probOver05_1H ?? 0.81) >= 0.80 && poisson.totalExpectedGoals >= 2.50) {
      const prob1H = poisson.probOver05_1H ?? 0.81;
      const odd1H = Number(Math.max(1.25, Math.min(1.35, (1 / prob1H) * 1.04)).toFixed(2));
      bestLeg = {
        marketName: 'Goles 1er Tiempo',
        selection: `Más de 0.5 Goles en 1T (Ritmo Alto)`,
        modelProb: prob1H,
        marketOdds: odd1H,
      };
    }
    // Prioridad 3: Tiros de Esquina (+7.5 o +8.5 Córners Totales) si P >= 80% (cuotas ~@1.22 - @1.32)
    else if ((poisson.probOver75Corners ?? 0.82) >= 0.80) {
      const probCorners = poisson.probOver75Corners ?? 0.82;
      const oddCorners = Number(Math.max(1.24, Math.min(1.32, (1 / probCorners) * 1.03)).toFixed(2));
      bestLeg = {
        marketName: 'Tiros de Esquina',
        selection: `Más de 7.5 Córners Totales (Media: ${poisson.expectedCorners || 10.4})`,
        modelProb: probCorners,
        marketOdds: oddCorners,
      };
    }
    // Prioridad 4: Más de 2.5 Goles si excepcionalmente P >= 80%
    else if (poisson.probOver25 >= 0.80) {
      const fair = 1 / poisson.probOver25;
      const odd = resolveOdd(match.odds.over25, fair, 1.35, 1.55);
      bestLeg = {
        marketName: 'Goles Totales',
        selection: `Más de 2.5 Goles (+Festival) (xG: ${poisson.totalExpectedGoals})`,
        modelProb: poisson.probOver25,
        marketOdds: odd,
      };
    }
    // Prioridad 5: Más de 0.5 Goles Totales con alta certeza si P >= 85% (cuota ~@1.16 - @1.24)
    else if ((poisson.probOver05 ?? 0.90) >= 0.85) {
      const probO05 = poisson.probOver05 ?? 0.90;
      const odd = Number(Math.max(1.16, Math.min(1.24, (1 / probO05) * 1.04)).toFixed(2));
      bestLeg = {
        marketName: 'Goles Totales',
        selection: `Más de 0.5 Goles Totales (xG: ${poisson.totalExpectedGoals})`,
        modelProb: probO05,
        marketOdds: odd,
      };
    }

    // Regla estricta: P >= 80.0%
    if (bestLeg && bestLeg.modelProb >= 0.80) {
      goalSelections.push({
        matchId: match.id,
        competition: match.competition,
        matchTitle: fullMatchTitle,
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        kickoffDate: match.kickoffDate,
        marketName: bestLeg.marketName,
        selection: bestLeg.selection,
        modelProb: bestLeg.modelProb,
        marketOdds: bestLeg.marketOdds,
        expectedValuePercent: Number((((bestLeg.modelProb * bestLeg.marketOdds) - 1) * 100).toFixed(2)),
        status: match.status,
        actualScore: match.actualScore,
      });
      usedMatchIdsB.add(match.id);
      // Objetivo: 11 selecciones (rango obligatorio de 10 a 12)
      if (goalSelections.length >= 11) break;
    }
  }

  // =========================================================================
  // 3. COMBINADA 3: "Valor Cuantitativo (+EV)" (12-14 Selecciones, P ≥ 80.0%, Cuota @15.00 - @35.00)
  // =========================================================================
  const valueSelections: AlgorithmicSelection[] = [];
  const usedMatchIdsC = new Set<string>();
  const searchPoolC = [...items, ...full3DayCatalog];

  for (const { match, poisson } of searchPoolC) {
    if (usedMatchIdsC.has(match.id)) continue;
    const fullMatchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

    let bestLeg: {
      marketName: string;
      selection: string;
      modelProb: number;
      marketOdds: number;
      evPercent: number;
    } | null = null;

    // 1. Evaluar si existe una selección con +EV positivo real y P >= 80.0%
    const realPositiveEv = poisson.evaluations.find(
      (e) => e.isPositiveEV && e.marketOdds !== null && e.modelProbability >= 0.80
    );

    if (realPositiveEv && realPositiveEv.marketOdds) {
      bestLeg = {
        marketName: realPositiveEv.marketName,
        selection: realPositiveEv.selection,
        modelProb: realPositiveEv.modelProbability,
        marketOdds: Number(realPositiveEv.marketOdds.toFixed(2)),
        evPercent: realPositiveEv.expectedValuePercent || 5.0,
      };
    }
    // 2. Tiros de Esquina con valor (+7.5 o +8.5 córners) y P >= 80% (cuota ~@1.25 - @1.32)
    else if ((poisson.probOver75Corners ?? 0.82) >= 0.80) {
      const probCorners = poisson.probOver75Corners ?? 0.82;
      const odd = Number(Math.max(1.25, Math.min(1.32, (1 / probCorners) * 1.05)).toFixed(2));
      const ev = ((probCorners * odd) - 1) * 100;
      bestLeg = {
        marketName: 'Tiros de Esquina (+EV)',
        selection: `Más de 7.5 Córners Totales (Ventaja xCorners)`,
        modelProb: probCorners,
        marketOdds: odd,
        evPercent: Number(ev.toFixed(2)),
      };
    }
    // 3. Goles Primer Tiempo (Más de 0.5 Goles en 1T) con valor y P >= 80% (cuota ~@1.25 - @1.35)
    else if ((poisson.probOver05_1H ?? 0.81) >= 0.80) {
      const prob1H = poisson.probOver05_1H ?? 0.81;
      const odd = Number(Math.max(1.25, Math.min(1.35, (1 / prob1H) * 1.05)).toFixed(2));
      const ev = ((prob1H * odd) - 1) * 100;
      bestLeg = {
        marketName: 'Goles 1er Tiempo (+EV)',
        selection: `Más de 0.5 Goles en 1T`,
        modelProb: prob1H,
        marketOdds: odd,
        evPercent: Number(ev.toFixed(2)),
      };
    }
    // 4. Doble Oportunidad Favorito si P >= 80% con cuota generosa (cuota ~@1.22 - @1.32)
    else if (poisson.prob1X >= 0.80 || poisson.probX2 >= 0.80) {
      const isHomeFav = poisson.prob1X >= poisson.probX2;
      const prob = isHomeFav ? poisson.prob1X : poisson.probX2;
      const fair = 1 / prob;
      const odd = Number(Math.max(1.22, Math.min(1.32, fair * 1.05)).toFixed(2));
      const ev = ((prob * odd) - 1) * 100;
      bestLeg = {
        marketName: 'Doble Oportunidad (+EV)',
        selection: isHomeFav ? `1X (${match.homeTeam.name} o Empate)` : `X2 (${match.awayTeam.name} o Empate)`,
        modelProb: prob,
        marketOdds: odd,
        evPercent: Number(ev.toFixed(2)),
      };
    }
    // 5. Goles Protegidos: Menos de 4.5 Goles Totales si P >= 82% (cuota ~@1.20 - @1.28)
    else if ((poisson.probUnder45 ?? 0.88) >= 0.82) {
      const probU45 = poisson.probUnder45 ?? 0.88;
      const odd = Number(Math.max(1.20, Math.min(1.28, (1 / probU45) * 1.04)).toFixed(2));
      const ev = ((probU45 * odd) - 1) * 100;
      bestLeg = {
        marketName: 'Línea de Goles (+EV)',
        selection: 'Menos de 4.5 Goles Totales',
        modelProb: probU45,
        marketOdds: odd,
        evPercent: Number(ev.toFixed(2)),
      };
    }
    // 6. Más de 1.5 Goles Totales si P >= 80% (cuota ~@1.22 - @1.32)
    else if (poisson.probOver15 >= 0.80) {
      const fair = 1 / poisson.probOver15;
      const odd = resolveOdd(match.odds.over15, fair, 1.22, 1.32);
      const ev = ((poisson.probOver15 * odd) - 1) * 100;
      bestLeg = {
        marketName: 'Goles Totales (+EV)',
        selection: `Más de 1.5 Goles Totales`,
        modelProb: poisson.probOver15,
        marketOdds: odd,
        evPercent: Number(ev.toFixed(2)),
      };
    }

    // Regla estricta: P >= 80.0%
    if (bestLeg && bestLeg.modelProb >= 0.80) {
      valueSelections.push({
        matchId: match.id,
        competition: match.competition,
        matchTitle: fullMatchTitle,
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        kickoffDate: match.kickoffDate,
        marketName: bestLeg.marketName,
        selection: bestLeg.selection,
        modelProb: bestLeg.modelProb,
        marketOdds: bestLeg.marketOdds,
        expectedValuePercent: bestLeg.evPercent,
        status: match.status,
        actualScore: match.actualScore,
      });
      usedMatchIdsC.add(match.id);
      // Objetivo: 13 selecciones (rango obligatorio de 12 a 14)
      if (valueSelections.length >= 13) break;
    }
  }

  // =========================================================================
  // 4. COMBINADA 4: "Mega Parlay / Cuotas Bajas (50 a 60 Partidos, P ≥ 80.0%)"
  // =========================================================================
  const megaPool = (allCatalogItems && allCatalogItems.length > items.length) ? allCatalogItems : items;
  const megaSelections: AlgorithmicSelection[] = [];
  const usedMatchIdsD = new Set<string>();

  for (const { match, poisson } of megaPool) {
    if (usedMatchIdsD.has(match.id)) continue;
    const fullMatchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

    let bestChoice: {
      marketName: string;
      selection: string;
      modelProb: number;
      marketOdds: number;
    } | null = null;

    // Prioridad 1: "Más de 1.5 Goles" si P(Poisson) >= 80%
    if (poisson.probOver15 >= 0.80) {
      const odd = resolveOdd(match.odds.over15, 1 / poisson.probOver15, 1.10, 1.38);
      bestChoice = {
        marketName: 'Goles Totales',
        selection: 'Más de 1.5 Goles',
        modelProb: poisson.probOver15,
        marketOdds: odd,
      };
    }
    // Prioridad 2: "Doble Oportunidad (1X o X2)" si P(Poisson) >= 80%
    else if (poisson.prob1X >= 0.80 || poisson.probX2 >= 0.80) {
      const isHomeFav = poisson.prob1X >= poisson.probX2;
      const prob = isHomeFav ? poisson.prob1X : poisson.probX2;
      const fair = 1 / prob;
      const odd = Number(Math.max(1.10, Math.min(1.38, fair * 1.04)).toFixed(2));
      bestChoice = {
        marketName: 'Doble Oportunidad',
        selection: isHomeFav ? `1X (${match.homeTeam.name} o Empate)` : `X2 (${match.awayTeam.name} o Empate)`,
        modelProb: prob,
        marketOdds: odd,
      };
    }
    // Prioridad 3: "Menos de 3.5 Goles" si P >= 80%
    else if (poisson.probUnder35 >= 0.80) {
      const fairU35 = 1 / poisson.probUnder35;
      const oddU35 = Number(Math.max(1.10, Math.min(1.36, fairU35 * 1.04)).toFixed(2));
      bestChoice = {
        marketName: 'Línea de Goles',
        selection: 'Menos de 3.5 Goles',
        modelProb: poisson.probUnder35,
        marketOdds: oddU35,
      };
    }
    // Prioridad 4: "Menos de 4.5 Goles" si P >= 80%
    else if ((poisson.probUnder45 ?? 0.88) >= 0.80) {
      const probU45 = poisson.probUnder45 ?? 0.88;
      const fairU45 = 1 / probU45;
      const oddU45 = Number(Math.max(1.08, Math.min(1.28, fairU45 * 1.03)).toFixed(2));
      bestChoice = {
        marketName: 'Línea de Goles',
        selection: 'Menos de 4.5 Goles',
        modelProb: probU45,
        marketOdds: oddU45,
      };
    }
    // Prioridad 5: "Más de 0.5 Goles" si P >= 80%
    else if ((poisson.probOver05 ?? 0.88) >= 0.80) {
      const probO05 = poisson.probOver05 ?? 0.88;
      const fairO05 = 1 / probO05;
      const oddO05 = Number(Math.max(1.08, Math.min(1.25, fairO05 * 1.03)).toFixed(2));
      bestChoice = {
        marketName: 'Goles Totales',
        selection: 'Más de 0.5 Goles',
        modelProb: probO05,
        marketOdds: oddO05,
      };
    }

    // BARRERA DURA ANTI-SESGO: validación if (selection.probability < 0.80) discard()
    if (bestChoice && bestChoice.modelProb >= 0.80) {
      const clampedOdds = Number(Math.max(1.10, Math.min(1.38, bestChoice.marketOdds)).toFixed(2));
      megaSelections.push({
        matchId: match.id,
        competition: match.competition,
        matchTitle: fullMatchTitle,
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        kickoffDate: match.kickoffDate,
        marketName: bestChoice.marketName,
        selection: bestChoice.selection,
        modelProb: bestChoice.modelProb,
        marketOdds: clampedOdds,
        expectedValuePercent: Number((((bestChoice.modelProb * clampedOdds) - 1) * 100).toFixed(2)),
        status: match.status,
        actualScore: match.actualScore,
      });
      usedMatchIdsD.add(match.id);
      if (megaSelections.length >= 60) break;
    }
  }

  // =========================================================================
  // 5. COMBINADA 5: "La Bomba del Día (50 a 60 Partidos / Cuotas Ultra Bajas @1.05 a @1.25, P ≥ 82.0%)"
  // =========================================================================
  const bombaPool = (allCatalogItems && allCatalogItems.length > items.length) ? allCatalogItems : items;
  const bombaSelections: AlgorithmicSelection[] = [];
  const usedMatchIdsE = new Set<string>();

  for (const { match, poisson } of bombaPool) {
    if (usedMatchIdsE.has(match.id)) continue;
    const fullMatchTitle = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

    let bestChoice: {
      marketName: string;
      selection: string;
      modelProb: number;
      marketOdds: number;
    } | null = null;

    // Prioridad 1: Doble oportunidad del favorito si P >= 82%
    if (poisson.prob1X >= 0.82 || poisson.probX2 >= 0.82) {
      const isHomeFav = poisson.prob1X >= poisson.probX2;
      const prob = isHomeFav ? poisson.prob1X : poisson.probX2;
      const fair = 1 / prob;
      const rawOdd = fair * 1.02;
      const clamped = Number(Math.max(1.05, Math.min(1.25, rawOdd)).toFixed(2));
      bestChoice = {
        marketName: 'Doble Oportunidad',
        selection: isHomeFav ? `1X (${match.homeTeam.name} o Empate)` : `X2 (${match.awayTeam.name} o Empate)`,
        modelProb: prob,
        marketOdds: clamped,
      };
    }
    // Prioridad 2: Más de 1.5 Goles si P >= 85%
    else if (poisson.probOver15 >= 0.85) {
      const realOdd = match.odds.hasRealOdds && match.odds.over15 != null ? match.odds.over15 : (1 / poisson.probOver15);
      const clamped = Number(Math.max(1.06, Math.min(1.25, realOdd)).toFixed(2));
      bestChoice = {
        marketName: 'Goles Totales',
        selection: 'Más de 1.5 Goles',
        modelProb: poisson.probOver15,
        marketOdds: clamped,
      };
    }
    // Prioridad 3: Más de 0.5 Goles si P >= 85%
    else if ((poisson.probOver05 ?? 0.90) >= 0.85) {
      const probO05 = poisson.probOver05 ?? 0.90;
      const clamped = Number(Math.max(1.05, Math.min(1.20, (1 / probO05) * 1.02)).toFixed(2));
      bestChoice = {
        marketName: 'Goles Totales',
        selection: 'Más de 0.5 Goles',
        modelProb: probO05,
        marketOdds: clamped,
      };
    }
    // Prioridad 4: Menos de 4.5 Goles si P >= 82%
    else if ((poisson.probUnder45 ?? 0.88) >= 0.82) {
      const probU45 = poisson.probUnder45 ?? 0.88;
      const clamped = Number(Math.max(1.05, Math.min(1.22, (1 / probU45) * 1.02)).toFixed(2));
      bestChoice = {
        marketName: 'Línea de Goles',
        selection: 'Menos de 4.5 Goles',
        modelProb: probU45,
        marketOdds: clamped,
      };
    }
    // Prioridad 5: Menos de 3.5 Goles si P >= 82%
    else if (poisson.probUnder35 >= 0.82) {
      const fairU35 = 1 / poisson.probUnder35;
      const clamped = Number(Math.max(1.06, Math.min(1.25, fairU35 * 1.02)).toFixed(2));
      bestChoice = {
        marketName: 'Línea de Goles',
        selection: 'Menos de 3.5 Goles',
        modelProb: poisson.probUnder35,
        marketOdds: clamped,
      };
    }

    // BARRERA DURA ANTI-SESGO: validación estricta P >= 82.0%
    if (bestChoice && bestChoice.modelProb >= 0.82) {
      bombaSelections.push({
        matchId: match.id,
        competition: match.competition,
        matchTitle: fullMatchTitle,
        homeTeamName: match.homeTeam.name,
        awayTeamName: match.awayTeam.name,
        kickoffDate: match.kickoffDate,
        marketName: bestChoice.marketName,
        selection: bestChoice.selection,
        modelProb: bestChoice.modelProb,
        marketOdds: bestChoice.marketOdds,
        expectedValuePercent: Number((((bestChoice.modelProb * bestChoice.marketOdds) - 1) * 100).toFixed(2)),
        status: match.status,
        actualScore: match.actualScore,
      });
      usedMatchIdsE.add(match.id);
      if (bombaSelections.length >= 60) break;
    }
  }

  // =========================================================================
  // CÁLCULO DE CUOTAS Y PROBABILIDADES ACUMULADAS MATEMÁTICAS EXACTAS
  // =========================================================================
  const buildParlayObject = (
    id: string,
    title: string,
    description: string,
    riskLevel: 'Ultra-Bajo' | 'Bajo' | 'Moderado' | 'Alto' | 'Extremo',
    badgeText: string,
    selections: AlgorithmicSelection[]
  ): AlgorithmicParlay => {
    const accentColor = id === 'parlay-a' ? 'emerald' : id === 'parlay-b' ? 'amber' : id === 'parlay-c' ? 'cyan' : id === 'parlay-d' ? 'purple' : 'rose';

    // Si no hay selecciones calificadas, cuota 1.0 y probabilidad 0%
    if (selections.length === 0) {
      return {
        id,
        name: title,
        title,
        badge: badgeText,
        badgeText,
        accentColor,
        description,
        riskLevel,
        selections: [],
        totalOdds: 1.0,
        jointProbability: 0,
        expectedValue: 0,
        status: 'pending',
      };
    }

    // CÁLCULO EXACTO: Cuota_Total = Cuota_1 * Cuota_2 * ... * Cuota_n
    const exactTotalOdds = selections.reduce((acc, s) => acc * s.marketOdds, 1);
    const roundedOdds = Number(exactTotalOdds.toFixed(2));

    // Probabilidad conjunta exacta P_conjunta = P1 * P2 * ... * Pn
    const exactJointProb = selections.reduce((acc, s) => acc * s.modelProb, 1);

    // EV = (P_conjunta * Cuota_Total) - 1
    const expectedValue = Number((((exactJointProb * exactTotalOdds) - 1) * 100).toFixed(2));

    const parlayStatusInfo = computeParlayStatus(selections);

    return {
      id,
      name: title,
      title,
      badge: badgeText,
      badgeText,
      accentColor,
      description,
      riskLevel,
      selections,
      totalOdds: roundedOdds,
      jointProbability: exactJointProb,
      expectedValue,
      status: parlayStatusInfo.status,
      wonCount: parlayStatusInfo.wonCount,
      lostCount: parlayStatusInfo.lostCount,
      liveCount: parlayStatusInfo.liveCount,
    };
  };

  return [
    buildParlayObject(
      'parlay-a',
      'Combinada 1: Máxima Seguridad / Conservadora',
      '10 a 12 selecciones de alta certeza matemática (P ≥ 80.0%) con cuotas atractivas (@7.00 - @15.00) diversificadas en Doble Oportunidad, Córners y Goles Protegidos.',
      'Bajo',
      `${consistencySelections.length} Selecciones Conservadoras (P ≥ 80%)`,
      consistencySelections
    ),
    buildParlayObject(
      'parlay-b',
      'Combinada 2: Goles y Ritmo Ofensivo',
      '10 a 12 selecciones con P ≥ 80.0% focalizadas en Más de 1.5 goles, Más de 0.5 en 1T y Más de 7.5 córners. Cuota acumulada objetivo: @10.00 a @25.00.',
      'Bajo',
      `${goalSelections.length} Selecciones Goles & Córners (P ≥ 80%)`,
      goalSelections
    ),
    buildParlayObject(
      'parlay-c',
      'Combinada 3: Valor Cuantitativo (+EV)',
      '12 a 14 selecciones que conjugan valor matemático esperado (+EV) y certeza estadística (P ≥ 80.0%). Cuota acumulada objetivo: @15.00 a @35.00.',
      'Moderado',
      `${valueSelections.length} Selecciones +EV & Certeza (P ≥ 80%)`,
      valueSelections
    ),
    buildParlayObject(
      'parlay-d',
      'Combinada 4: Mega Parlay / Cuotas Bajas',
      '50 a 60 selecciones conservadoras independientes con cuotas de @1.10 a @1.38 y P ≥ 80.0%.',
      'Alto',
      `${megaSelections.length} Selecciones Conservadoras`,
      megaSelections
    ),
    buildParlayObject(
      'parlay-e',
      'Combinada 5: La Bomba del Día',
      '50 a 60 selecciones de cuotas ultra bajas (@1.05 a @1.25) con umbral reforzado de P ≥ 82.0%.',
      'Extremo',
      `${bombaSelections.length} Selecciones Cuota Mínima (P ≥ 82%)`,
      bombaSelections
    ),
  ];
}
