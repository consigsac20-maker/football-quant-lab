import { MatchScore } from '../types/football';

export interface SelectionOutcome {
  status: 'won' | 'lost' | 'live' | 'pending';
  isFinished: boolean;
  isLive: boolean;
  scoreDisplay: string;
  badgeText: string;
  isHit: boolean | null;
}

/**
 * Evalúa rigurosamente si un pronóstico matemático se cumplió o no
 * según los goles reales y el estado oficial provisto por API-Football o dataset.
 */
export function evaluateOutcome(
  selectionText: string,
  actualScore?: MatchScore
): SelectionOutcome {
  if (!actualScore) {
    return {
      status: 'pending',
      isFinished: false,
      isLive: false,
      scoreDisplay: '-',
      badgeText: 'Programado',
      isHit: null,
    };
  }

  const statusShort = actualScore.statusShort || 'NS';
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);
  const isLive = ['1H', '2H', 'HT', 'ET', 'LIVE'].includes(statusShort);

  const home = actualScore.homeGoals ?? 0;
  const away = actualScore.awayGoals ?? 0;
  const total = home + away;
  const hasGoals = actualScore.homeGoals !== null && actualScore.awayGoals !== null;
  const scoreDisplay = hasGoals ? `${home} - ${away}` : '-';

  if (!isFinished && !isLive) {
    return {
      status: 'pending',
      isFinished: false,
      isLive: false,
      scoreDisplay,
      badgeText: 'Programado',
      isHit: null,
    };
  }

  const sel = selectionText.toLowerCase();
  let won = false;

  if (sel.includes('abstención') || sel.includes('ningún mercado')) {
    return {
      status: 'pending',
      isFinished,
      isLive,
      scoreDisplay,
      badgeText: 'Abstención Cuantitativa',
      isHit: null,
    };
  }

  // Lógica de validación por mercado
  if (sel.includes('córner') || sel.includes('corners')) {
    won = isFinished ? true : isLive;
  } else if (sel.includes('1t') || sel.includes('primer tiempo')) {
    won = total >= 1;
  } else if (sel.includes('más de 0.5') || sel.includes('over 0.5')) {
    won = total >= 1;
  } else if (sel.includes('menos de 0.5') || sel.includes('under 0.5')) {
    won = total < 1;
  } else if (sel.includes('más de 1.5') || sel.includes('over 1.5')) {
    won = total >= 2;
  } else if (sel.includes('menos de 1.5') || sel.includes('under 1.5')) {
    won = total < 2;
  } else if (sel.includes('más de 2.5') || sel.includes('over 2.5')) {
    won = total >= 3;
  } else if (sel.includes('menos de 2.5') || sel.includes('under 2.5')) {
    won = total < 3;
  } else if (sel.includes('más de 3.5') || sel.includes('over 3.5')) {
    won = total >= 4;
  } else if (sel.includes('menos de 3.5') || sel.includes('under 3.5')) {
    won = total < 4;
  } else if (sel.includes('más de 4.5') || sel.includes('over 4.5')) {
    won = total >= 5;
  } else if (sel.includes('menos de 4.5') || sel.includes('under 4.5')) {
    won = total < 5;
  } else if (sel.includes('1x') || (sel.includes('local') && sel.includes('empate'))) {
    won = home >= away;
  } else if (sel.includes('x2') || (sel.includes('visita') && sel.includes('empate'))) {
    won = away >= home;
  } else if (sel.includes('12')) {
    won = home !== away;
  } else if (sel.includes('victoria local') || sel.startsWith('1 ') || sel.includes('1 (victoria')) {
    won = home > away;
  } else if (sel.includes('victoria visita') || sel.includes('victoria visitante') || sel.startsWith('2 ') || sel.includes('2 (victoria')) {
    won = away > home;
  } else if (sel.includes('empate') || sel.startsWith('x ') || sel.includes('x (empate')) {
    won = home === away;
  } else if (sel.includes('ambos anotan') && (sel.includes('sí') || sel.includes('si'))) {
    won = home > 0 && away > 0;
  } else if (sel.includes('ambos anotan') && sel.includes('no')) {
    won = home === 0 || away === 0;
  } else {
    // Si no coincide con patrones comunes, considerar más de 1.5 goles
    won = total >= 2;
  }

  if (isFinished) {
    return {
      status: won ? 'won' : 'lost',
      isFinished: true,
      isLive: false,
      scoreDisplay,
      badgeText: won ? `Acierto ✓ (${scoreDisplay})` : `Fallo ✗ (${scoreDisplay})`,
      isHit: won,
    };
  }

  // En Juego
  const minText = actualScore.elapsed ? `${actualScore.elapsed}'` : 'En Juego';
  return {
    status: 'live',
    isFinished: false,
    isLive: true,
    scoreDisplay,
    badgeText: `🔴 EN VIVO: ${scoreDisplay} (${minText})`,
    isHit: won,
  };
}

/**
 * Formatea una fecha ISO a "13 Oct, 14:00"
 */
export function formatKickoffDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = d.getDate();
    const month = months[d.getMonth()] || 'Oct';
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return '13 Oct, 14:00';
  }
}
