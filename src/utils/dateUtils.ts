/**
 * Utilidades Dinámicas de Fechas para Football Quant Lab
 * Prohíbe fechas estáticas y calcula en tiempo real basándose en el reloj local del cliente.
 */

export interface DynamicDateRange {
  todayStr: string;      // YYYY-MM-DD
  tomorrowStr: string;   // YYYY-MM-DD
  in2daysStr: string;    // YYYY-MM-DD
  todayLabel: string;    // ej: "Hoy (14 Oct)"
  tomorrowLabel: string; // ej: "Mañana (15 Oct)"
  in2daysLabel: string;  // ej: "En 2 días (16 Oct)"
}

export function formatDayMonth(d: Date): string {
  const day = d.getDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${day} ${months[d.getMonth()]}`;
}

export function getDynamicDates(): DynamicDateRange {
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const in2days = new Date(today.getTime() + 172800000);

  const toIsoDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = toIsoDate(today);
  const tomorrowStr = toIsoDate(tomorrow);
  const in2daysStr = toIsoDate(in2days);

  return {
    todayStr,
    tomorrowStr,
    in2daysStr,
    todayLabel: `Hoy (${formatDayMonth(today)})`,
    tomorrowLabel: `Mañana (${formatDayMonth(tomorrow)})`,
    in2daysLabel: `En 2 días (${formatDayMonth(in2days)})`,
  };
}

/**
 * Valida si la caché de localStorage corresponde al día de hoy.
 * Si es de un día anterior, la invalida automáticamente.
 */
export function checkAndInvalidateOutdatedCache(cacheKeyPrefix: string = 'fql_'): boolean {
  try {
    const storedDate = localStorage.getItem(`${cacheKeyPrefix}last_sync_date`);
    const todayStr = getDynamicDates().todayStr;
    if (storedDate && storedDate !== todayStr) {
      // Limpiar datos de fechas pasadas
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(cacheKeyPrefix) || key.startsWith('apifootball_cache_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(`${cacheKeyPrefix}last_sync_date`, todayStr);
      return true; // Fue invalidada
    }
    if (!storedDate) {
      localStorage.setItem(`${cacheKeyPrefix}last_sync_date`, todayStr);
    }
    return false;
  } catch (e) {
    return false;
  }
}
