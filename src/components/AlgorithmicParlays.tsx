import React, { useState } from 'react';
import { AlgorithmicParlay } from '../types/football';
import { evaluateOutcome, formatKickoffDateTime } from '../engine/outcome';
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, Calendar, AlertTriangle, Layers, Calculator, Flame } from 'lucide-react';

interface AlgorithmicParlaysProps {
  parlays: AlgorithmicParlay[];
}

export const AlgorithmicParlays: React.FC<AlgorithmicParlaysProps> = ({ parlays }) => {
  const [selectedParlayId, setSelectedParlayId] = useState<string>(parlays[0]?.id || 'parlay-a');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!parlays || parlays.length === 0) return null;

  const activeParlay = parlays.find((p) => p.id === selectedParlayId) || parlays[0];

  const formatJointProb = (p: number) => {
    const pct = p * 100;
    if (pct === 0) return '0.0000%';
    if (pct < 0.0001) return `${pct.toExponential(3)}%`;
    return `${pct.toFixed(4)}%`;
  };

  const handleCopy = (parlay: AlgorithmicParlay) => {
    const isMasiva = parlay.id === 'parlay-d' || parlay.id === 'parlay-e';
    const textLines = [
      `📊 FOOTBALL QUANT LAB — ${parlay.name.toUpperCase()}`,
      `📌 ${parlay.description}`,
      `💰 Cuota Total Acumulada: @${parlay.totalOdds > 99999 ? parlay.totalOdds.toExponential(2) : parlay.totalOdds.toFixed(2)}`,
      `🎯 Probabilidad Conjunta Real: ${formatJointProb(parlay.jointProbability)}`,
      `🔢 Total Selecciones: ${parlay.selections.length} partidos`,
      `📐 Multiplicación Exacta: ${parlay.selections.slice(0, 5).map((s) => s.marketOdds.toFixed(2)).join(' × ')} ... (${parlay.selections.length} cuotas) = @${parlay.totalOdds.toFixed(2)}`,
      '',
      isMasiva
        ? '⚠️ AVISO CUANTITATIVO: Aunque cada selección individual tiene alta probabilidad (~80-85%), la probabilidad matemática acumulada al combinar 50-60 eventos se diluye progresivamente.\n'
        : '',
      `--- LISTA DE ${parlay.selections.length} SELECCIONES ---`,
      ...parlay.selections.map((s, idx) => {
        const outcome = evaluateOutcome(s.selection, s.actualScore);
        const statusNote = outcome.isFinished ? ` [${outcome.badgeText}]` : outcome.isLive ? ' [🔴 EN VIVO]' : '';
        return `${idx + 1}. [${formatKickoffDateTime(s.kickoffDate)}] ${s.competition}: ${s.matchTitle} -> ${s.selection} (@${s.marketOdds.toFixed(2)} | P: ${(s.modelProb * 100).toFixed(1)}%)${statusNote}`;
      }),
      '',
      `🕒 Generado: ${new Date().toLocaleString('es-ES')}`,
    ];

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedId(parlay.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getBadgeColor = (id: string) => {
    switch (id) {
      case 'parlay-a':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'parlay-b':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'parlay-c':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'parlay-d':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
      case 'parlay-e':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getActiveClass = (id: string) => {
    switch (id) {
      case 'parlay-a':
        return 'border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30';
      case 'parlay-b':
        return 'border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30';
      case 'parlay-c':
        return 'border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30';
      case 'parlay-d':
        return 'border-purple-500/90 shadow-lg shadow-purple-500/15 ring-1 ring-purple-500/40';
      case 'parlay-e':
        return 'border-rose-500/90 shadow-lg shadow-rose-500/15 ring-1 ring-rose-500/40';
      default:
        return 'border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden mb-6 shadow-xl backdrop-blur-md">
      {/* Cabecera del Módulo */}
      <div className="p-4 sm:p-5 border-b border-slate-800/90 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                Top 5 Combinadas Algorítmicas
              </h2>
              <span className="text-[10px] bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                Boletos 10-14 Sel. & Parlays Masivos (50-60)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Combinadas de 10 a 14 selecciones diversificadas (cuotas @7.00 - @35.00) hasta Mega Parlays de 50 a 60 partidos independientes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-end sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <span>{isExpanded ? 'Minimizar' : 'Desplegar'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Selector de las 5 Combinadas (Responsivo: 1 col móvil, 2 tablet, 5 desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {parlays.map((parlay) => {
              const isActive = parlay.id === selectedParlayId;

              // Calcular aciertos y fallos reales si hay partidos finalizados
              let wonCount = 0;
              let lostCount = 0;
              parlay.selections.forEach((s) => {
                const evalRes = evaluateOutcome(s.selection, s.actualScore);
                if (evalRes.isFinished) {
                  if (evalRes.isHit) wonCount++;
                  else lostCount++;
                }
              });

              return (
                <button
                  key={parlay.id}
                  onClick={() => setSelectedParlayId(parlay.id)}
                  className={`p-3 sm:p-3.5 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? `bg-slate-950 ${getActiveClass(parlay.id)}`
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border truncate max-w-[140px] sm:max-w-[160px] ${getBadgeColor(
                          parlay.id
                        )}`}
                      >
                        {parlay.badge}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium shrink-0 ml-1">
                        {parlay.selections.length} sel.
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-xs sm:text-xs font-mono leading-snug line-clamp-2">
                      {parlay.name}
                    </h3>

                    {/* Resumen de aciertos / fallos */}
                    {(wonCount > 0 || lostCount > 0) && (
                      <div className="mt-1 flex items-center gap-1.5 text-[9px] font-mono">
                        {wonCount > 0 && (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                            {wonCount} ✓
                          </span>
                        )}
                        {lostCount > 0 && (
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">
                            {lostCount} ✗
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-baseline justify-between font-mono">
                    <div>
                      <div className="text-[9px] text-slate-500 font-sans">Cuota Total</div>
                      <div className="text-sm sm:text-base font-bold text-white">
                        @{parlay.totalOdds > 99999 ? parlay.totalOdds.toExponential(2) : parlay.totalOdds.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500 font-sans">P. Conjunta</div>
                      <div className="text-[11px] font-bold text-emerald-400">
                        {formatJointProb(parlay.jointProbability)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tarjeta Detallada del Boleto Activo */}
          <div className="bg-slate-950 rounded-xl p-4 sm:p-5 border border-slate-800 space-y-4">
            {/* Header del Boleto Activo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                    {activeParlay.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      activeParlay.id === 'parlay-e'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : activeParlay.id === 'parlay-d'
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {activeParlay.selections.length} Partidos Independientes
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeParlay.description}
                </p>
              </div>

              {/* Botón de Copiar Lista Completa */}
              <button
                onClick={() => handleCopy(activeParlay)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 ${
                  copiedId === activeParlay.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : activeParlay.id === 'parlay-e'
                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20'
                    : activeParlay.id === 'parlay-d'
                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {copiedId === activeParlay.id ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>¡{activeParlay.selections.length} Selecciones Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Lista Completa ({activeParlay.selections.length} Partidos)</span>
                  </>
                )}
              </button>
            </div>

            {/* AVISO CUANTITATIVO PARA PARLAY 4 (MEGA PARLAY) */}
            {activeParlay.id === 'parlay-d' && (
              <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-3.5 flex items-start space-x-3 text-xs font-mono text-purple-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <span>⚠️ Advertencia Cuantitativa — Mega Parlay</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                      Multiplicación de Probabilidades
                    </span>
                  </div>
                  <p className="text-purple-300/90 leading-relaxed text-[11px] sm:text-xs">
                    Aunque cada selección individual tiene alta probabilidad (~80%), la probabilidad matemática acumulada en 50 eventos es cercana a 0.001%. Cada partido introduce riesgo multiplicativo independiente.
                  </p>
                </div>
              </div>
            )}

            {/* AVISO CUANTITATIVO PARA PARLAY 5 (LA BOMBA DEL DÍA) */}
            {activeParlay.id === 'parlay-e' && (
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-3.5 flex items-start space-x-3 text-xs font-mono text-rose-200">
                <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <span>💣 Advertencia Cuantitativa — La Bomba del Día</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      Cuotas Mínimas @1.08 - @1.25
                    </span>
                  </div>
                  <p className="text-rose-300/90 leading-relaxed text-[11px] sm:text-xs">
                    Aunque cada selección individual tiene una probabilidad muy alta (≥ 82-85%), la probabilidad matemática conjunta al multiplicar 50-60 eventos se diluye progresivamente (P_total = P1 × P2 × ... × Pn). Tratar este boleto como jugada de fantasía/bomba de cuota acumulada alta con importe simbólico.
                  </p>
                </div>
              </div>
            )}

            {/* Resumen Cuantitativo del Boleto */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Cuota Total Acumulada</div>
                <div className="text-xl font-bold text-white mt-0.5 truncate">
                  @{activeParlay.totalOdds > 99999 ? activeParlay.totalOdds.toExponential(2) : activeParlay.totalOdds.toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-sans">
                  Producto exacto ({activeParlay.selections.length} cuotas)
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Prob. Matemática Conjunta</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {formatJointProb(activeParlay.jointProbability)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-sans">
                  P1 × P2 × ... × Pn
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Total Selecciones</div>
                <div className="text-xl font-bold text-cyan-400 mt-0.5">
                  {activeParlay.selections.length} Partidos
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-sans">
                  1 por encuentro (independientes)
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Rango de Cuotas</div>
                <div className="text-base font-bold text-purple-400 mt-1 flex items-center justify-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>
                    {activeParlay.id === 'parlay-e'
                      ? '@1.08 - @1.25'
                      : activeParlay.id === 'parlay-d'
                      ? '@1.12 - @1.38'
                      : '@1.20 - @2.50+'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-sans">
                  {activeParlay.id === 'parlay-e'
                    ? 'Cuotas ultrabajas / mínimas'
                    : activeParlay.id === 'parlay-d'
                    ? 'Mercados ultraconservadores'
                    : 'Mercados calculados'}
                </div>
              </div>
            </div>

            {/* Lista Desglosada y Deslizable (Scrollable) con los Partidos */}
            <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-1 scrollbar-thin">
              {activeParlay.selections.map((sel, idx) => {
                const outcome = evaluateOutcome(sel.selection, sel.actualScore);

                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono border transition-all ${
                      outcome.isFinished
                        ? outcome.isHit
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-rose-950/20 border-rose-500/40'
                        : outcome.isLive
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Información Principal: Número, Fecha, Competición, Equipos */}
                    <div className="flex items-start space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1 min-w-0">
                        {/* Fecha y Competición */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <Calendar className="w-3 h-3 text-cyan-400" />
                            {formatKickoffDateTime(sel.kickoffDate)}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                            {sel.competition}
                          </span>
                        </div>

                        {/* Nombres Completos de Equipos */}
                        <div className="font-bold text-white text-xs sm:text-sm truncate">
                          {sel.homeTeamName} <span className="text-slate-500 font-normal">vs</span> {sel.awayTeamName}
                        </div>
                      </div>
                    </div>

                    {/* Pronóstico Seleccionado, Cuota Individual y Estado Real */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-300">
                          {sel.selection}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-2 mt-0.5">
                          <span>Prob: {(sel.modelProb * 100).toFixed(1)}%</span>
                          <span>•</span>
                          <span className="text-white font-bold bg-slate-800 px-1.5 py-0.2 rounded">
                            @{sel.marketOdds.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Estado del Partido y Marcador Final */}
                      <div className="shrink-0 text-right min-w-[70px]">
                        {outcome.isFinished ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                outcome.isHit
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {outcome.badgeText}
                            </span>
                            <div className="text-[10px] text-amber-300/90 font-mono font-bold">
                              {outcome.scoreDisplay}
                            </div>
                          </div>
                        ) : outcome.isLive ? (
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              🔴 EN VIVO
                            </span>
                            <div className="text-[10px] text-amber-300 font-bold">
                              {outcome.scoreDisplay}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60">
                            Programado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
