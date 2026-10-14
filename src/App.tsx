import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getDynamicDates, generateDynamicMockMatches } from './data/mock-matches';
import { calculatePoissonModel } from './engine/poisson';
import { generateAlgorithmicParlays } from './engine/parlays';
import { FootballMatch, PoissonOutput, CompetitionGroup } from './types/football';
import { Header } from './components/Header';
import { MetricsBanner } from './components/MetricsBanner';
import { FilterBar, SmartFilterType, DateFilterType, SortByType } from './components/FilterBar';
import { MatchCard } from './components/MatchCard';
import { MatchModal } from './components/MatchModal';
import { BetSimulatorModal } from './components/BetSimulatorModal';
import { ProviderMatrixModal } from './components/ProviderMatrixModal';
import { MethodologyModal } from './components/MethodologyModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AlgorithmicParlays } from './components/AlgorithmicParlays';
import {
  fetchFixturesForDate,
  filterAndTransformFixtures,
  checkAndInvalidateStaleDateCache,
  clearAllFixturesCache,
} from './services/apiFootball';
import { RotateCcw } from 'lucide-react';

export default function App() {
  // Manejo dinámico de fechas en tiempo real (new Date())
  const dynamicDates = useMemo(() => getDynamicDates(), []);

  // Estados de conexión y fuente de datos
  const [apiStatus, setApiStatus] = useState<'live' | 'mock'>('mock');
  const [matches, setMatches] = useState<FootballMatch[]>(() => generateDynamicMockMatches());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estados de filtrado y orden
  const [selectedGroup, setSelectedGroup] = useState<CompetitionGroup | 'Todos'>('Todos');
  const [selectedDate, setSelectedDate] = useState<DateFilterType>('all');
  const [smartFilter, setSmartFilter] = useState<SmartFilterType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('probability');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [selectedMatchData, setSelectedMatchData] = useState<{
    match: FootballMatch;
    poisson: PoissonOutput;
  } | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);

  // Control de caché: Si la fecha almacenada no coincide con el día calendario actual, descartar la caché automáticamente
  useEffect(() => {
    checkAndInvalidateStaleDateCache(dynamicDates.today);
  }, [dynamicDates.today]);

  // Carga inteligente de API-Football con fallback al dataset calibrado dinámico
  const loadMatches = useCallback(
    async (bypassCache = false) => {
      const dates = [dynamicDates.today, dynamicDates.tomorrow, dynamicDates.in2days];
      try {
        const apiResults = await Promise.allSettled(
          dates.map((d) => fetchFixturesForDate(d, bypassCache))
        );

        let anySuccess = false;
        const combinedMatches: FootballMatch[] = [];
        const fallbackMock = generateDynamicMockMatches();

        apiResults.forEach((res, idx) => {
          const dateStr = dates[idx];
          if (res.status === 'fulfilled' && res.value.fixtures && res.value.fixtures.length > 0) {
            anySuccess = true;
            const transformed = filterAndTransformFixtures(res.value.fixtures, dateStr);
            // Usar estrictamente los partidos que cumplen la Whitelist oficial
            combinedMatches.push(...transformed);
          } else {
            // Fallback para ese día específico si la llamada a la API falló
            combinedMatches.push(...fallbackMock.filter((m) => m.kickoffDate.startsWith(dateStr)));
          }
        });

        if (anySuccess && combinedMatches.length > 0) {
          setMatches(combinedMatches);
          setApiStatus('live');
        } else {
          setMatches(fallbackMock);
          setApiStatus('mock');
        }
      } catch {
        setMatches(generateDynamicMockMatches());
        setApiStatus('mock');
      }
    },
    [dynamicDates]
  );

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Actualizar Datos en Vivo al presionar el botón interactivo de la cabecera
  const handleRefreshLive = async () => {
    setIsRefreshing(true);
    try {
      clearAllFixturesCache();
      await loadMatches(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Pre-computar el modelo de Poisson para todos los partidos cargados
  const matchesWithCalculations = useMemo(() => {
    return matches.map((match) => {
      const poisson = calculatePoissonModel(match);
      return { match, poisson };
    });
  }, [matches]);

  // Contadores exactos en tiempo real para el selector de fecha
  const dateCounts = useMemo(() => {
    let todayCount = 0;
    let tomorrowCount = 0;
    let in2daysCount = 0;

    matches.forEach((m) => {
      if (m.kickoffDate.startsWith(dynamicDates.today)) todayCount++;
      else if (m.kickoffDate.startsWith(dynamicDates.tomorrow)) tomorrowCount++;
      else if (m.kickoffDate.startsWith(dynamicDates.in2days)) in2daysCount++;
    });

    return {
      all: matches.length,
      today: todayCount,
      tomorrow: tomorrowCount,
      in2days: in2daysCount,
    };
  }, [matches, dynamicDates]);

  // Partidos filtrados según la fecha seleccionada para las 5 Combinadas
  const matchesForParlays = useMemo(() => {
    if (selectedDate === 'today') {
      return matchesWithCalculations.filter((m) => m.match.kickoffDate.startsWith(dynamicDates.today));
    }
    if (selectedDate === 'tomorrow') {
      return matchesWithCalculations.filter((m) => m.match.kickoffDate.startsWith(dynamicDates.tomorrow));
    }
    if (selectedDate === 'in2days') {
      return matchesWithCalculations.filter((m) => m.match.kickoffDate.startsWith(dynamicDates.in2days));
    }
    return matchesWithCalculations;
  }, [matchesWithCalculations, selectedDate, dynamicDates]);

  // Generar las 5 Combinadas Algorítmicas Top con umbral estricto anti-sesgo P ≥ 80%
  const algorithmicParlays = useMemo(() => {
    return generateAlgorithmicParlays(matchesForParlays, matchesWithCalculations);
  }, [matchesForParlays, matchesWithCalculations]);

  // Calcular métricas globales del catálogo
  const globalMetrics = useMemo(() => {
    let totalEVCount = 0;
    let totalXG = 0;
    let totalQuality = 0;

    matchesWithCalculations.forEach(({ match, poisson }) => {
      totalXG += poisson.totalExpectedGoals;
      totalQuality += match.dataQuality.completenessScore;
      const hasEV = poisson.evaluations.some((e) => e.isPositiveEV);
      if (hasEV) totalEVCount += 1;
    });

    const count = matchesWithCalculations.length || 1;
    return {
      totalMatches: matchesWithCalculations.length,
      totalEVOpportunities: totalEVCount,
      avgExpectedGoals: totalXG / count,
      avgDataQuality: totalQuality / count,
    };
  }, [matchesWithCalculations]);

  // Filtrado y Ordenamiento por Grado de Certeza
  const filteredAndSortedMatches = useMemo(() => {
    // 1. Filtrar
    const filtered = matchesWithCalculations.filter(({ match, poisson }) => {
      // Filtro por fecha dinámico
      if (selectedDate === 'today' && !match.kickoffDate.startsWith(dynamicDates.today)) {
        return false;
      }
      if (selectedDate === 'tomorrow' && !match.kickoffDate.startsWith(dynamicDates.tomorrow)) {
        return false;
      }
      if (selectedDate === 'in2days' && !match.kickoffDate.startsWith(dynamicDates.in2days)) {
        return false;
      }

      // Filtro por región geográfica
      if (selectedGroup !== 'Todos' && match.competitionGroup !== selectedGroup) {
        return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = `${match.homeTeam.name} ${match.awayTeam.name} ${match.competition} ${match.venue}`.toLowerCase();
        if (!matchTitle.includes(q)) return false;
      }

      // Smart Filters
      if (smartFilter === 'high_consistency') {
        const hasHighProb =
          poisson.probHomeWin >= 0.80 ||
          poisson.probAwayWin >= 0.80 ||
          poisson.probOver15 >= 0.80 ||
          poisson.prob1X >= 0.80 ||
          poisson.probX2 >= 0.80 ||
          poisson.probUnder35 >= 0.80;
        return hasHighProb;
      }

      if (smartFilter === 'high_goals') {
        return poisson.totalExpectedGoals >= 2.80 || poisson.probOver25 > 0.65;
      }

      if (smartFilter === 'positive_ev') {
        return poisson.evaluations.some((e) => e.isPositiveEV);
      }

      if (smartFilter === 'abstention') {
        return (
          poisson.uncertaintyLevel === 'Abstención Recomendada' ||
          match.dataQuality.completenessScore < 85
        );
      }

      return true;
    });

    // 2. Ordenar por Grado de Certeza
    return filtered.sort((a, b) => {
      if (sortBy === 'probability') {
        // Máxima probabilidad en cualquiera de los mercados primarios
        const maxProbA = Math.max(a.poisson.probHomeWin, a.poisson.probAwayWin, a.poisson.probOver15, a.poisson.prob1X, a.poisson.probX2);
        const maxProbB = Math.max(b.poisson.probHomeWin, b.poisson.probAwayWin, b.poisson.probOver15, b.poisson.prob1X, b.poisson.probX2);
        return maxProbB - maxProbA;
      }
      if (sortBy === 'goals') {
        return b.poisson.totalExpectedGoals - a.poisson.totalExpectedGoals;
      }
      if (sortBy === 'ev') {
        const maxEvA = Math.max(...a.poisson.evaluations.map((e) => e.expectedValuePercent ?? -100));
        const maxEvB = Math.max(...b.poisson.evaluations.map((e) => e.expectedValuePercent ?? -100));
        return maxEvB - maxEvA;
      }
      return 0;
    });
  }, [matchesWithCalculations, selectedDate, selectedGroup, smartFilter, sortBy, searchQuery, dynamicDates]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Cabecera Principal con botón interactivo Actualizar Datos */}
      <Header
        onOpenProviders={() => setIsProviderModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorModalOpen(true)}
        onOpenMethodology={() => setIsMethodologyModalOpen(true)}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        onRefreshData={handleRefreshLive}
        isRefreshing={isRefreshing}
        apiStatus={apiStatus}
        matchCount={matchesWithCalculations.length}
        evCount={globalMetrics.totalEVOpportunities}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner de Métricas Cuantitativas */}
        <MetricsBanner
          totalMatches={globalMetrics.totalMatches}
          totalEVOpportunities={globalMetrics.totalEVOpportunities}
          avgExpectedGoals={globalMetrics.avgExpectedGoals}
          avgDataQuality={globalMetrics.avgDataQuality}
          filteredCount={filteredAndSortedMatches.length}
        />

        {/* Sección Destacada: Top 5 Combinadas Algorítmicas Cuantitativas */}
        <AlgorithmicParlays parlays={algorithmicParlays} />

        {/* Barra de Filtros con Selector de Fecha Dinámico */}
        <FilterBar
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          smartFilter={smartFilter}
          onSelectSmartFilter={setSmartFilter}
          sortBy={sortBy}
          onSelectSortBy={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          evCount={globalMetrics.totalEVOpportunities}
          dateCounts={dateCounts}
          dynamicDates={dynamicDates}
        />

        {/* Grid de Partidos */}
        {filteredAndSortedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedMatches.map(({ match, poisson }) => (
              <MatchCard
                key={match.id}
                match={match}
                poisson={poisson}
                onOpenDetails={(m, p) => setSelectedMatchData({ match: m, poisson: p })}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
            <div className="text-slate-400 text-sm font-mono">
              No se encontraron partidos con los filtros seleccionados.
            </div>
            <button
              onClick={() => {
                setSelectedGroup('Todos');
                setSelectedDate('all');
                setSmartFilter('all');
                setSortBy('probability');
                setSearchQuery('');
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>Football Quant Lab • Motor Matemático Poisson Bivariado & De-Margining • API-Football v3 Integrado</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Control de fechas en tiempo real (reloj del navegador) • Umbral estricto anti-sesgo ≥ 80.0% • 5 Combinadas Cuantitativas
          </p>
        </div>
      </footer>

      {/* Modales */}
      {selectedMatchData && (
        <MatchModal
          match={selectedMatchData.match}
          poisson={selectedMatchData.poisson}
          onClose={() => setSelectedMatchData(null)}
        />
      )}

      {isSimulatorModalOpen && (
        <BetSimulatorModal
          matches={matchesWithCalculations}
          onClose={() => setIsSimulatorModalOpen(false)}
        />
      )}

      {isApiKeyModalOpen && (
        <ApiKeyModal
          onClose={() => setIsApiKeyModalOpen(false)}
          onKeyUpdated={() => loadMatches(true)}
        />
      )}

      {isProviderModalOpen && (
        <ProviderMatrixModal onClose={() => setIsProviderModalOpen(false)} />
      )}

      {isMethodologyModalOpen && (
        <MethodologyModal onClose={() => setIsMethodologyModalOpen(false)} />
      )}
    </div>
  );
}
