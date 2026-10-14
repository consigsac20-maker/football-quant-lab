import React from 'react';
import { FootballMatch, PoissonOutput } from '../types/football';
import { evaluateOutcome, formatKickoffDateTime } from '../engine/outcome';
import { ArrowUpRight, ShieldCheck, AlertTriangle, Mountain, Calendar, ChevronRight } from 'lucide-react';

interface MatchCardProps {
  match: FootballMatch;
  poisson: PoissonOutput;
  onOpenDetails: (match: FootballMatch, poisson: PoissonOutput) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, poisson, onOpenDetails }) => {
  const { homeTeam, awayTeam, odds, context, dataQuality, actualScore } = match;

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;
  const formatOdd = (val: number | null | undefined) => (val != null ? val.toFixed(2) : '--');

  const hasRealOdds = Boolean(odds.hasRealOdds);
  const highDiscrepancyEvaluations = poisson.evaluations.filter((e) => e.isHighDiscrepancy);

  // Estado del partido y marcadores reales
  const statusShort = actualScore?.statusShort || (match.status === 'Finalizado' ? 'FT' : match.status === 'En Vivo' ? '1H' : 'NS');
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort) || match.status === 'Finalizado';
  const isLive = ['1H', '2H', 'HT', 'ET', 'LIVE'].includes(statusShort) || match.status === 'En Vivo';
  const hasScore = actualScore?.homeGoals !== null && actualScore?.homeGoals !== undefined && actualScore?.awayGoals !== null && actualScore?.awayGoals !== undefined;
  const homeGoals = actualScore?.homeGoals ?? 0;
  const awayGoals = actualScore?.awayGoals ?? 0;

  // Evaluar resultado real contra el pronóstico clave
  const outcomePrimary = evaluateOutcome(poisson.keyForecast.primary.label, actualScore);
  const outcomeSecondary = poisson.keyForecast.secondary
    ? evaluateOutcome(poisson.keyForecast.secondary.label, actualScore)
    : null;

  // Selecciones con EV positivo (solo si existen cuotas reales)
  const positiveEVs = hasRealOdds ? poisson.evaluations.filter((e) => e.isPositiveEV) : [];

  // Form pills color
  const getFormBadge = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'D':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'L':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    }
  };

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-md ${
        isFinished
          ? 'bg-slate-900 border-2 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
          : isLive
          ? 'bg-slate-900 border-2 border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
          : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Cabecera del Partido */}
      <div className={`p-4 border-b ${isFinished ? 'border-amber-500/30 bg-amber-950/20' : isLive ? 'border-rose-500/30 bg-rose-950/20' : 'border-slate-800/80 bg-slate-950/60'}`}>
        {/* BADGE DESTACADO: SI TERMINÓ -> AMARILLO / ÁMBAR */}
        {isFinished && hasScore && (
          <div className="bg-amber-500/20 border border-amber-500/60 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-amber-300 mb-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm">🏁 Finalizado:</span>
              <span className="text-white text-sm bg-amber-500/30 px-2 py-0.5 rounded border border-amber-400/50">
                {homeGoals} - {awayGoals}
              </span>
            </div>
            {outcomePrimary.isHit !== null && (
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                  outcomePrimary.isHit
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60'
                    : 'bg-rose-500/30 text-rose-300 border-rose-500/60'
                }`}
              >
                {outcomePrimary.isHit ? 'Acierto ✓' : 'Fallo ✗'}
              </span>
            )}
          </div>
        )}

        {/* BADGE DESTACADO: SI ESTÁ EN VIVO -> ROJO/VERDE PULSANTE */}
        {isLive && hasScore && (
          <div className="bg-rose-500/15 border border-rose-500/50 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-rose-300 mb-2.5 animate-pulse shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>🔴 EN VIVO:</span>
              <span className="text-white text-sm bg-rose-500/30 px-2 py-0.5 rounded border border-rose-400/40">
                {homeGoals} - {awayGoals}
              </span>
              <span className="text-rose-300 text-[11px] font-normal">
                ({actualScore?.elapsed ? `${actualScore.elapsed}'` : 'En Juego'})
              </span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded border border-rose-500/40">
              Minuto en vivo
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-300 font-mono">
              {match.competition}
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {match.competitionGroup}
            </span>
          </div>

          {/* Calidad de datos */}
          <div className="flex items-center space-x-1.5">
            <div
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                dataQuality.completenessScore >= 90
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : dataQuality.completenessScore >= 75
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{dataQuality.completenessScore}% Calidad</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatKickoffDateTime(match.kickoffDate)}
          </span>
          <span className="text-[11px] text-slate-500 truncate max-w-[180px]">{match.venue}</span>
        </div>

        {/* STICKERS / SELLOS DESTACADOS SEGÚN EL ANÁLISIS DE POISSON */}
        <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
          {/* A. STICKER DE GOLEADA UNILATERAL (LOCAL O VISITANTE) */}
          {poisson.lambdaHome >= 2.50 && poisson.lambdaAway <= 0.85 && (
            <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm animate-pulse">
              <span className="text-sm">⚡</span>
              <span className="leading-tight">
                AQUÍ SE ESPERA QUE GOLEE EL EQUIPO LOCAL ({homeTeam.name}) | Proyección: +2.5 / +3 Goles
              </span>
            </div>
          )}

          {poisson.lambdaAway >= 2.50 && poisson.lambdaHome <= 0.85 && (
            <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm animate-pulse">
              <span className="text-sm">⚡</span>
              <span className="leading-tight">
                AQUÍ SE ESPERA QUE GOLEE EL EQUIPO VISITANTE ({awayTeam.name}) | Proyección: +2.5 / +3 Goles
              </span>
            </div>
          )}

          {/* B. STICKER DE PARTIDO OVER / FESTIVAL DE GOLES */}
          {(poisson.totalExpectedGoals >= 3.20 || poisson.probOver25 >= 0.65) && (
            <div className="bg-amber-500/15 border border-amber-500/50 text-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-sm">
              <span className="text-sm">🔥</span>
              <span className="leading-tight">
                PARTIDO PARA GOLES / OVER ABIERTO | Expectativa Conjunta: {poisson.totalExpectedGoals.toFixed(2)} goles
              </span>
            </div>
          )}

          {/* C. STICKER DE ADVERTENCIA TÁCTICA / PARTIDO CERRADO */}
          {poisson.totalExpectedGoals < 2.0 && (
            <div className="bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium shadow-sm">
              <span className="text-sm">🛡️</span>
              <span className="leading-tight">
                DUELO TÁCTICO CERRADO / BAJA EXPECTATIVA DE GOLES | xG Proyectado: {poisson.totalExpectedGoals.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cuerpo de la Tarjeta */}
      <div className="p-4 space-y-3.5">
        {/* Equipos */}
        <div className="grid grid-cols-2 gap-4">
          {/* Local */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm truncate">{homeTeam.name}</span>
              {homeTeam.rank && (
                <span className="text-[10px] text-slate-500 font-mono">#{homeTeam.rank}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {homeTeam.recentForm.slice(-4).map((f, i) => (
                <span
                  key={i}
                  className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center border ${getFormBadge(f)}`}
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Ataque: <span className="text-emerald-400">{homeTeam.attackStrength.toFixed(2)}x</span> | Def: <span className="text-cyan-400">{homeTeam.defenseStrength.toFixed(2)}x</span>
            </div>
          </div>

          {/* Visitante */}
          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-between flex-row-reverse">
              <span className="font-bold text-white text-sm truncate">{awayTeam.name}</span>
              {awayTeam.rank && (
                <span className="text-[10px] text-slate-500 font-mono">#{awayTeam.rank}</span>
              )}
            </div>
            <div className="flex items-center justify-end space-x-1">
              {awayTeam.recentForm.slice(-4).map((f, i) => (
                <span
                  key={i}
                  className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center border ${getFormBadge(f)}`}
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Ataque: <span className="text-emerald-400">{awayTeam.attackStrength.toFixed(2)}x</span> | Def: <span className="text-cyan-400">{awayTeam.defenseStrength.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* 📌 BLOQUE DESTACADO: "LO QUE TIENE MAYOR PROBABILIDAD DE SUCEDER" */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2.5 font-mono text-xs shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
              <span>📌</span>
              <span>Pronóstico Clave:</span>
              <span className="text-white underline decoration-emerald-500 decoration-2 font-bold">
                {poisson.keyForecast.primary.label} ({(poisson.keyForecast.primary.prob * 100).toFixed(1)}%)
              </span>
            </div>
            {isFinished && outcomePrimary.isHit !== null && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                  outcomePrimary.isHit
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-500/25 text-rose-300 border-rose-500/50'
                }`}
              >
                {outcomePrimary.isHit ? 'Acierto ✓' : 'Fallo ✗'}
              </span>
            )}
          </div>
          {poisson.keyForecast.secondary && (
            <div className="text-[11px] text-emerald-400/90 mt-1 pl-4 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span>✓ Segunda opción probable:</span>
                <span className="text-slate-200 font-semibold">
                  {poisson.keyForecast.secondary.label} ({(poisson.keyForecast.secondary.prob * 100).toFixed(1)}%)
                </span>
              </div>
              {isFinished && outcomeSecondary && outcomeSecondary.isHit !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${
                    outcomeSecondary.isHit
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {outcomeSecondary.isHit ? 'Acierto ✓' : 'Fallo ✗'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Goles Esperados (Poisson Lambdas) & Único Marcador Más Probable */}
        <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <div className="text-slate-400">
              λ Local: <span className="text-emerald-400 font-bold">{poisson.lambdaHome.toFixed(2)}</span>
            </div>
            <div className="text-slate-300 font-semibold bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">
              Expectativa Total xG: {poisson.totalExpectedGoals}
            </div>
            <div className="text-slate-400">
              λ Visita: <span className="text-cyan-400 font-bold">{poisson.lambdaAway.toFixed(2)}</span>
            </div>
          </div>

          {/* Barra proporcional de lambda */}
          <div className="h-1.5 bg-slate-800 rounded-full flex overflow-hidden">
            <div
              className="bg-emerald-500 transition-all"
              style={{
                width: `${(poisson.lambdaHome / (poisson.lambdaHome + poisson.lambdaAway)) * 100}%`,
              }}
            />
            <div
              className="bg-cyan-500 transition-all"
              style={{
                width: `${(poisson.lambdaAway / (poisson.lambdaHome + poisson.lambdaAway)) * 100}%`,
              }}
            />
          </div>

          {/* ÚNICA LÍNEA CLARA Y DESTACADA: Marcador Más Probable */}
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono">
            <span className="text-[11px] text-slate-300 font-medium">Marcador Más Probable:</span>
            <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-0.5 rounded-md font-bold">
              {poisson.projectedScore.score} con {(poisson.projectedScore.prob * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Tabla Cuantitativa: Modelo vs Mercado 1X2 */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-medium flex justify-between items-center">
            <span>Resultado 1X2</span>
            <span>
              {hasRealOdds ? 'Probabilidad / Cuota Real / +EV' : 'Probabilidad / Cuota Justa (Modelo)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
            {/* Victoria Local */}
            {(() => {
              const ev = poisson.evaluations.find((e) => e.selection.includes('Victoria Local'));
              return (
                <div
                  className={`p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                    ev?.isPositiveEV
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-bold">1 (Victoria Local)</div>
                  <div className="text-xs font-bold my-0.5">{formatPercent(poisson.probHomeWin)}</div>
                  <div className="text-[10px] text-slate-400 flex flex-col items-center">
                    {hasRealOdds && odds.homeWin != null ? (
                      <div className="flex justify-between items-center w-full px-0.5">
                        <span className="font-bold text-slate-200">@{formatOdd(odds.homeWin)}</span>
                        {ev?.isPositiveEV && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">
                            +{ev.expectedValuePercent}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <span className="text-cyan-400 font-bold">Justa: @{ev?.fairOdds.toFixed(2)}</span>
                        <span className="text-[8px] text-amber-400/80">Cuota pendiente</span>
                      </div>
                    )}
                    {ev?.isHighDiscrepancy && (
                      <span className="text-[8px] text-rose-400 font-bold mt-0.5">⚠️ Discrepancia</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Empate */}
            {(() => {
              const ev = poisson.evaluations.find((e) => e.selection.includes('Empate'));
              return (
                <div
                  className={`p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                    ev?.isPositiveEV
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-bold">X (Empate)</div>
                  <div className="text-xs font-bold my-0.5">{formatPercent(poisson.probDraw)}</div>
                  <div className="text-[10px] text-slate-400 flex flex-col items-center">
                    {hasRealOdds && odds.draw != null ? (
                      <div className="flex justify-between items-center w-full px-0.5">
                        <span className="font-bold text-slate-200">@{formatOdd(odds.draw)}</span>
                        {ev?.isPositiveEV && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">
                            +{ev.expectedValuePercent}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <span className="text-cyan-400 font-bold">Justa: @{ev?.fairOdds.toFixed(2)}</span>
                        <span className="text-[8px] text-amber-400/80">Cuota pendiente</span>
                      </div>
                    )}
                    {ev?.isHighDiscrepancy && (
                      <span className="text-[8px] text-rose-400 font-bold mt-0.5">⚠️ Discrepancia</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Victoria Visitante */}
            {(() => {
              const ev = poisson.evaluations.find((e) => e.selection.includes('Victoria Visitante'));
              return (
                <div
                  className={`p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                    ev?.isPositiveEV
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-bold">2 (Victoria Visita)</div>
                  <div className="text-xs font-bold my-0.5">{formatPercent(poisson.probAwayWin)}</div>
                  <div className="text-[10px] text-slate-400 flex flex-col items-center">
                    {hasRealOdds && odds.awayWin != null ? (
                      <div className="flex justify-between items-center w-full px-0.5">
                        <span className="font-bold text-slate-200">@{formatOdd(odds.awayWin)}</span>
                        {ev?.isPositiveEV && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">
                            +{ev.expectedValuePercent}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <span className="text-cyan-400 font-bold">Justa: @{ev?.fairOdds.toFixed(2)}</span>
                        <span className="text-[8px] text-amber-400/80">Cuota pendiente</span>
                      </div>
                    )}
                    {ev?.isHighDiscrepancy && (
                      <span className="text-[8px] text-rose-400 font-bold mt-0.5">⚠️ Discrepancia</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Mercados de Goles: Más / Menos de 1.5 y 2.5 */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300">Línea 1.5 Goles</span>
              <span>{hasRealOdds ? 'Cuota' : 'Cuota Justa'}</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Más de 1.5: {formatPercent(poisson.probOver15)}</span>
              <span className={hasRealOdds ? 'text-slate-300 font-bold' : 'text-cyan-400 font-medium'}>
                {hasRealOdds && odds.over15 != null ? `@${formatOdd(odds.over15)}` : `Justa: @${(1 / poisson.probOver15).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Menos de 1.5: {formatPercent(poisson.probUnder15)}</span>
              <span className={hasRealOdds ? 'text-slate-400' : 'text-slate-500'}>
                {hasRealOdds && odds.under15 != null ? `@${formatOdd(odds.under15)}` : `Justa: @${(1 / poisson.probUnder15).toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300">Línea 2.5 Goles</span>
              <span>{hasRealOdds ? 'Cuota' : 'Cuota Justa'}</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Más de 2.5: {formatPercent(poisson.probOver25)}</span>
              <span className={hasRealOdds ? 'text-slate-300 font-bold' : 'text-cyan-400 font-medium'}>
                {hasRealOdds && odds.over25 != null ? `@${formatOdd(odds.over25)}` : `Justa: @${(1 / poisson.probOver25).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Menos de 2.5: {formatPercent(poisson.probUnder25)}</span>
              <span className={hasRealOdds ? 'text-slate-400' : 'text-slate-500'}>
                {hasRealOdds && odds.under25 != null ? `@${formatOdd(odds.under25)}` : `Justa: @${(1 / poisson.probUnder25).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Factores Contextuales (Altitud o Notas) */}
        {context.altitudeMeters && context.altitudeMeters > 2000 && (
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            <div className="flex items-center space-x-1.5">
              <Mountain className="w-3.5 h-3.5" />
              <span>Factor Altitud: {context.altitudeMeters} msnm</span>
            </div>
            <span className="text-[10px] text-amber-300">Impacto aeróbico considerado</span>
          </div>
        )}

        {/* Alerta de Discrepancia Estadística Alta si existe */}
        {hasRealOdds && highDiscrepancyEvaluations.length > 0 && (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-2 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <div className="text-[10px] leading-tight">
              <span className="font-bold">Discrepancia estadística alta:</span> Diferencia &gt;35% entre el modelo y la cuota del mercado en {highDiscrepancyEvaluations.length} mercado(s).
            </div>
          </div>
        )}

        {/* Resumen de Oportunidades con Ventaja Estadística (+EV) o Estado Pendiente */}
        {hasRealOdds && positiveEVs.length > 0 ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 text-xs">
            <div className="flex items-center justify-between text-emerald-400 font-mono font-bold text-[11px]">
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Ventaja Estadística sobre la Cuota (+EV):
              </span>
              <span>{positiveEVs.length} mercado(s)</span>
            </div>
            <div className="mt-1 space-y-0.5 text-[10px] font-mono text-emerald-300">
              {positiveEVs.slice(0, 2).map((ev, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>• {ev.selection}</span>
                  <span className="font-bold">+{ev.expectedValuePercent}% Retorno (Cuota {ev.marketOdds})</span>
                </div>
              ))}
            </div>
          </div>
        ) : !hasRealOdds ? (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-xs flex items-center justify-between font-mono text-slate-400">
            <span className="text-[10px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Cuota de mercado pendiente</span>
            </span>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              Solo Cuota Justa (1/P)
            </span>
          </div>
        ) : null}

        {/* Advertencia de Incertidumbre si aplica */}
        {poisson.uncertaintyLevel === 'Abstención Recomendada' && (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-2 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="text-[10px] leading-tight">
              {poisson.abstainReason || 'Incertidumbre elevada. Abstención recomendada.'}
            </span>
          </div>
        )}
      </div>

      {/* Botón de Auditoría Detallada */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <button
          onClick={() => onOpenDetails(match, poisson)}
          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-mono font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 transition-colors"
        >
          <span>Auditar Modelo & Matriz de Marcadores 6x6</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
