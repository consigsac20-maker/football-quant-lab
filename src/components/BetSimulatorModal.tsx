import React, { useState } from 'react';
import { FootballMatch, PoissonOutput, MarketEvaluation } from '../types/football';
import { X, AlertTriangle, Calculator, Sparkles, CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface BetSimulatorModalProps {
  matches: Array<{ match: FootballMatch; poisson: PoissonOutput }>;
  onClose: () => void;
}

interface SelectedBet {
  matchId: string;
  matchTitle: string;
  marketName: string;
  selection: string;
  modelProb: number;
  marketOdd: number;
  evPercent: number;
}

export const BetSimulatorModal: React.FC<BetSimulatorModalProps> = ({ matches, onClose }) => {
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);

  // Agregar selección
  const handleAddBet = (match: FootballMatch, evalItem: MarketEvaluation) => {
    // Si ya existe en la lista, no duplicar
    if (selectedBets.some((b) => b.matchId === match.id && b.selection === evalItem.selection)) {
      return;
    }

    setSelectedBets([
      ...selectedBets,
      {
        matchId: match.id,
        matchTitle: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        marketName: evalItem.marketName,
        selection: evalItem.selection,
        modelProb: evalItem.modelProbability,
        marketOdd: evalItem.marketOdds !== null ? evalItem.marketOdds : evalItem.fairOdds,
        evPercent: evalItem.expectedValuePercent !== null ? evalItem.expectedValuePercent : 0,
      },
    ]);
  };

  const handleRemoveBet = (index: number) => {
    setSelectedBets(selectedBets.filter((_, i) => i !== index));
  };

  // Detectar correlación: más de una selección del mismo partido
  const matchIdCounts: Record<string, number> = {};
  selectedBets.forEach((b) => {
    matchIdCounts[b.matchId] = (matchIdCounts[b.matchId] || 0) + 1;
  });
  const hasCorrelation = Object.values(matchIdCounts).some((count) => count > 1);

  // Cálculos conjuntos bajo independencia
  const combinedProb = selectedBets.reduce((acc, b) => acc * b.modelProb, 1);
  const combinedOdds = selectedBets.reduce((acc, b) => acc * b.marketOdd, 1);
  const combinedEV = (combinedProb * combinedOdds) - 1;

  // Lista de todas las selecciones +EV disponibles en el dataset para agregar rápido
  const availableEVs: Array<{ match: FootballMatch; evalItem: MarketEvaluation }> = [];
  matches.forEach(({ match, poisson }) => {
    poisson.evaluations.forEach((evalItem) => {
      if (evalItem.isPositiveEV) {
        availableEVs.push({ match, evalItem });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Simulador de Selecciones Cuantitativas</h2>
              <p className="text-[11px] text-slate-400">
                Cálculo de probabilidad conjunta y detección de correlaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Alerta de Correlación */}
          {hasCorrelation && (
            <div className="bg-rose-950/40 border border-rose-500/50 p-3 rounded-xl text-rose-300 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-bold">Advertencia de Correlación Intradía:</span>
                <p className="text-[11px] text-rose-200/90 mt-0.5">
                  Has seleccionado múltiples mercados del mismo partido. No se puede asumir independencia matemática (P(A ∩ B) ≠ P(A) · P(B)). El producto directo de probabilidades no es válido para eventos interdependientes.
                </p>
              </div>
            </div>
          )}

          {/* Resumen del Simulador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px]">Probabilidad Conjunta</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {selectedBets.length > 0 ? `${(combinedProb * 100).toFixed(2)}%` : '0.00%'}
              </div>
              <div className="text-[10px] text-slate-500">
                {selectedBets.length} selección(es)
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px]">Cuota Decimal Acumulada</div>
              <div className="text-xl font-bold text-white mt-1">
                {selectedBets.length > 0 ? `@${combinedOdds.toFixed(2)}` : '@1.00'}
              </div>
              <div className="text-[10px] text-slate-500">
                Producto de cuotas de mercado
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px]">Valor Esperado Teórico (+EV)</div>
              <div
                className={`text-xl font-bold mt-1 ${
                  combinedEV > 0 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {selectedBets.length > 0
                  ? `${combinedEV > 0 ? '+' : ''}${(combinedEV * 100).toFixed(2)}%`
                  : '0.00%'}
              </div>
              <div className="text-[10px] text-slate-500">
                Retorno esperado por unidad
              </div>
            </div>
          </div>

          {/* Lista de selecciones actuales */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold text-slate-200">Selecciones en la Cesta:</span>
              {selectedBets.length > 0 && (
                <button
                  onClick={() => setSelectedBets([])}
                  className="text-rose-400 hover:text-rose-300 text-[11px]"
                >
                  Vaciar cesta
                </button>
              )}
            </div>

            {selectedBets.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500">
                No hay selecciones añadidas. Puedes añadir una oportunidad +EV de la lista inferior.
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedBets.map((b, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-bold">{b.matchTitle}</div>
                      <div className="text-slate-400 text-[11px]">
                        {b.marketName}: <span className="text-emerald-400">{b.selection}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-white font-bold">@{b.marketOdd.toFixed(2)}</div>
                        <div className="text-emerald-400 text-[10px]">+{b.evPercent}% EV</div>
                      </div>
                      <button
                        onClick={() => handleRemoveBet(i)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agregar Oportunidades +EV Rápidas */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oportunidades +EV Detectadas en los 15 Partidos (Click para agregar):</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {availableEVs.map(({ match, evalItem }, idx) => {
                const isSelected = selectedBets.some(
                  (b) => b.matchId === match.id && b.selection === evalItem.selection
                );
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border flex items-center justify-between text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white">
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </span>{' '}
                      • {evalItem.marketName}:{' '}
                      <span className="text-emerald-400 font-semibold">{evalItem.selection}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">
                        @{evalItem.marketOdds !== null ? evalItem.marketOdds.toFixed(2) : evalItem.fairOdds.toFixed(2)}
                      </span>
                      {evalItem.expectedValuePercent !== null && (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                          +{evalItem.expectedValuePercent}% EV
                        </span>
                      )}

                      <button
                        onClick={() =>
                          isSelected
                            ? setSelectedBets(
                                selectedBets.filter(
                                  (b) =>
                                    !(b.matchId === match.id && b.selection === evalItem.selection)
                                )
                              )
                            : handleAddBet(match, evalItem)
                        }
                        className={`p-1 rounded ${
                          isSelected
                            ? 'text-emerald-400 hover:text-rose-400'
                            : 'text-slate-400 hover:text-white bg-slate-800'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
