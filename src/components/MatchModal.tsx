import React, { useState } from 'react';
import { FootballMatch, PoissonOutput } from '../types/football';
import { X, ShieldCheck, TrendingUp, AlertCircle, Info, Database, Layers } from 'lucide-react';

interface MatchModalProps {
  match: FootballMatch;
  poisson: PoissonOutput;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ match, poisson, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'odds' | 'context'>('matrix');

  const { homeTeam, awayTeam, odds, context, dataQuality } = match;

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatOdd = (val: number | null | undefined) => (val != null ? val.toFixed(2) : 'Pendiente');

  // Determinar color de calor para la celda de la matriz
  const getCellBg = (prob: number) => {
    if (prob >= 0.12) return 'bg-emerald-500/40 text-emerald-100 font-bold border-emerald-400';
    if (prob >= 0.08) return 'bg-emerald-500/25 text-emerald-200 border-emerald-500/30';
    if (prob >= 0.05) return 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30';
    if (prob >= 0.02) return 'bg-slate-800/80 text-slate-300 border-slate-700';
    return 'bg-slate-900/60 text-slate-500 border-slate-800/50';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {match.competition} • {match.competitionGroup}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(match.kickoffDate).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              {homeTeam.name} <span className="text-slate-500 font-normal">vs</span> {awayTeam.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'matrix'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Matriz de Marcadores 6x6 & Dixon-Coles
          </button>
          <button
            onClick={() => setActiveTab('odds')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'odds'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Auditoría de Cuotas & De-Margining (+EV)
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'context'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Contexto, Bajas & Trazabilidad
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* Resumen de Lambdas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center font-mono">
                  <div className="text-xs text-slate-400">λ Goles Local ({homeTeam.shortName})</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{poisson.lambdaHome.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Ataque {homeTeam.attackStrength.toFixed(2)}x • Def Rival {awayTeam.defenseStrength.toFixed(2)}x
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center font-mono">
                  <div className="text-xs text-slate-400">Total Goles Esperados (xG)</div>
                  <div className="text-xl font-bold text-white mt-1">{poisson.totalExpectedGoals}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Promedio Liga: {match.leagueAverages.avgTotalGoals.toFixed(2)} goles
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center font-mono">
                  <div className="text-xs text-slate-400">λ Goles Visita ({awayTeam.shortName})</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">{poisson.lambdaAway.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Ataque {awayTeam.attackStrength.toFixed(2)}x • Def Rival {homeTeam.defenseStrength.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Matriz Bivariada 6x6 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      Distribución Bivariada P(Local = x, Visita = y)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Filas: Goles {homeTeam.name} | Columnas: Goles {awayTeam.name}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 mt-2 sm:mt-0">
                    Ajuste Dixon-Coles ρ = {poisson.dixonColesRho} aplicado
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center font-mono text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-slate-500 font-medium border border-slate-800/80 bg-slate-900/60">
                          {homeTeam.shortName} \ {awayTeam.shortName}
                        </th>
                        {[0, 1, 2, 3, 4, 5].map((g) => (
                          <th
                            key={g}
                            className="p-2 text-slate-400 font-semibold border border-slate-800/80 bg-slate-900/60"
                          >
                            {g} {g === 1 ? 'gol' : 'goles'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 1, 2, 3, 4, 5].map((x) => (
                        <tr key={x}>
                          <th className="p-2 text-slate-400 font-semibold border border-slate-800/80 bg-slate-900/60">
                            {x} {x === 1 ? 'gol' : 'goles'}
                          </th>
                          {[0, 1, 2, 3, 4, 5].map((y) => {
                            const prob = poisson.scoreMatrix[x]?.[y] || 0;
                            return (
                              <td
                                key={y}
                                className={`p-2 border transition-all ${getCellBg(prob)}`}
                              >
                                {formatPercent(prob)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Marcadores Top 3 Destacados */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-xs font-mono font-bold text-white flex items-center justify-between">
                    <span>Top 3 Marcadores Más Probables (Distribución Bivariada):</span>
                    <span className="text-[11px] text-slate-400 font-normal">Suma conjunta: {((poisson.top3Scores.reduce((acc, s) => acc + s.prob, 0)) * 100).toFixed(1)}%</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {poisson.top3Scores.map((score, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-center justify-between font-mono ${
                          i === 0
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            i === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{i + 1}
                          </span>
                          <span className="text-sm font-bold text-white">{score.score}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${i === 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {formatPercent(score.prob)}
                          </span>
                          <div className="text-[9px] text-slate-500">probabilidad</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coherencia Matemática */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Control de Coherencia Matemática:</span>
                </div>
                <div className="text-slate-200">
                  P(1) + P(X) + P(2) = {(poisson.probHomeWin + poisson.probDraw + poisson.probAwayWin) * 100}% • P(Más 2.5) + P(Menos 2.5) = {((poisson.probOver25 + poisson.probUnder25) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {activeTab === 'odds' && (
            <div className="space-y-4">
              {/* Banner de Estado de Cuotas */}
              {!odds.hasRealOdds ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-300 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-xs">Cuotas de Mercado Pendientes</div>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      API-Football no incluye cuotas de corredores en vivo para este partido en la llamada actual. Se muestra exclusivamente la <span className="text-cyan-300 font-semibold">Cuota Justa del Modelo (1 / P)</span> calculada matemáticamente con Poisson Dixon-Coles. El cálculo de ventaja cuantitativa (+EV) se encuentra temporalmente desactivado para garantizar cero alucinación estadística.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-200 font-bold">Cuotas Reales de Mercado Provistas por API</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Proveedor: <span className="text-white font-semibold">{odds.bookmaker}</span> {odds.overround1X2 ? `(Margen Overround: ${odds.overround1X2}%)` : ''}
                  </span>
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white font-mono">
                    Comparador de Valor Esperado (+EV) & Cuota Justa
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {odds.hasRealOdds ? `Proveedor: ${odds.bookmaker}` : 'Modo Cuota Justa (Sin Corredor)'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Mercado</th>
                        <th className="pb-2">Selección</th>
                        <th className="pb-2 text-right">Prob. Modelo</th>
                        <th className="pb-2 text-right">Cuota Justa</th>
                        <th className="pb-2 text-right">Cuota Mercado</th>
                        <th className="pb-2 text-right">Prob. Implícita</th>
                        <th className="pb-2 text-right">Valor (+EV)</th>
                        <th className="pb-2 text-center">Auditoría / Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {poisson.evaluations.map((ev, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-900/50 transition-colors ${
                            ev.isPositiveEV ? 'bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="py-2.5 text-slate-300">{ev.marketName}</td>
                          <td className="py-2.5 font-bold text-white">{ev.selection}</td>
                          <td className="py-2.5 text-right text-slate-200">
                            {formatPercent(ev.modelProbability)}
                          </td>
                          <td className="py-2.5 text-right text-cyan-400 font-bold">
                            @{formatOdd(ev.fairOdds)}
                          </td>
                          <td className="py-2.5 text-right font-bold text-white">
                            {ev.marketOdds != null ? `@${formatOdd(ev.marketOdds)}` : (
                              <span className="text-slate-500 text-[10px] italic">Pendiente</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-slate-400">
                            {ev.marketImpliedProb != null ? formatPercent(ev.marketImpliedProb) : '—'}
                          </td>
                          <td className="py-2.5 text-right">
                            {ev.expectedValuePercent !== null ? (
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded ${
                                  ev.isPositiveEV
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'text-slate-500'
                                }`}
                              >
                                {ev.expectedValuePercent > 0 ? '+' : ''}
                                {ev.expectedValuePercent}%
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[10px]">N/A</span>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            {ev.isHighDiscrepancy ? (
                              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                                ⚠️ Discrepancia &gt;35%
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                  ev.evRobustness === 'Fuerte'
                                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                                    : ev.evRobustness === 'Moderado'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : ev.evRobustness === 'Incierto'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : ev.evRobustness === 'Cuota Pendiente'
                                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                {ev.evRobustness}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-slate-900/80 rounded-lg text-slate-400 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Fórmula Teórica de Valor Esperado & Probabilidad Implícita:</span>
                  </div>
                  <p>
                    <code className="text-emerald-400 font-bold">EV = (Probabilidad_Modelo × Cuota_Decimal) - 1</code>
                    <span className="mx-2 text-slate-600">•</span>
                    <code className="text-cyan-400">Probabilidad_Implícita = 1 / Cuota_Decimal</code>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Si no hay cuotas oficiales del corredor, se anula el cálculo de EV para evitar cifras engañosas y se calcula la Cuota Justa mediante <code className="text-slate-300">1 / P(Poisson)</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'context' && (
            <div className="space-y-4 font-mono text-xs">
              {/* Factores Contextuales */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white">Factores Contextuales Auditados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[11px]">Estadio y Condiciones:</div>
                    <div className="font-semibold text-white">{match.venue}</div>
                    {context.altitudeMeters && (
                      <div className="text-amber-400 text-[11px]">
                        Altitud: {context.altitudeMeters} msnm (Impacto aeróbico visitante evaluado)
                      </div>
                    )}
                    {context.temperatureC && (
                      <div className="text-slate-400 text-[11px]">Temperatura: {context.temperatureC} °C</div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[11px]">Días de Descanso y Fatiga:</div>
                    <div>{homeTeam.name}: <span className="font-bold text-emerald-400">{homeTeam.restDays} días</span></div>
                    <div>{awayTeam.name}: <span className="font-bold text-cyan-400">{awayTeam.restDays} días</span></div>
                    <div className="text-[11px] text-slate-500">
                      {context.derbyMatch ? '🔥 Partido Clásico / Derby' : 'Encuentro Regular'}
                    </div>
                  </div>
                </div>

                {/* Bajas Clave */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Bajas Confirmadas o Dudas:</div>
                  <div className="text-slate-300">
                    {homeTeam.keyAbsences && homeTeam.keyAbsences.length > 0
                      ? `${homeTeam.name}: ${homeTeam.keyAbsences.join(', ')}`
                      : `${homeTeam.name}: Plantel completo disponible.`}
                  </div>
                  <div className="text-slate-300">
                    {awayTeam.keyAbsences && awayTeam.keyAbsences.length > 0
                      ? `${awayTeam.name}: ${awayTeam.keyAbsences.join(', ')}`
                      : `${awayTeam.name}: Plantel completo disponible.`}
                  </div>
                </div>

                {context.tacticalNotes && (
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-slate-300">
                    <span className="text-slate-400 text-[11px]">Notas Tácticas: </span>
                    {context.tacticalNotes}
                  </div>
                )}
              </div>

              {/* Trazabilidad de los Datos */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-slate-400">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Trazabilidad y Calidad de Datos</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">Fuente:</span>
                    <div className="text-slate-200">{dataQuality.dataSource}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Muestra Histórica:</span>
                    <div className="text-slate-200">{dataQuality.sampleSize} partidos</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Estado:</span>
                    <div className="text-emerald-400 font-bold">{dataQuality.verificationStatus}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Capturado en:</span>
                    <div className="text-slate-200">
                      {new Date(dataQuality.capturedAt).toLocaleTimeString('es-ES')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ID Registro: {match.id} (Trazable)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Cerrar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
