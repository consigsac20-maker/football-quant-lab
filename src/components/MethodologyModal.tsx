import React from 'react';
import { X, Layers, CheckCircle2, ShieldAlert } from 'lucide-react';

interface MethodologyModalProps {
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Metodología Cuantitativa: Poisson & Dixon-Coles
              </h2>
              <p className="text-[11px] text-slate-400">
                Fundamentos matemáticos y aislamiento de alucinaciones
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-300">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-white font-bold text-sm">1. Goles Esperados (λ Local y λ Visitante)</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Los parámetros de intensidad media de goles no se inventan. Se estiman mediante el producto normalizado de fuerzas ofensivas y debilidades defensivas de los equipos frente al promedio histórico de la competición:
            </p>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400">
              λ_Local = Ataque_Local × Defensa_Visitante × MediaGolesLocal_Liga × FactorAltitud<br />
              λ_Visita = Ataque_Visitante × Defensa_Local × MediaGolesVisita_Liga
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-white font-bold text-sm">2. Ajuste Bivariado Dixon-Coles (1997)</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              La distribución Poisson independiente subestima los marcadores bajos (0-0, 1-1). Aplicamos la función multiplicativa de correlación τ(x, y, λ, μ, ρ) con ρ = -0.08:
            </p>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-cyan-300 text-[11px] space-y-0.5">
              <div>• τ(0, 0) = 1 - (λ · μ · ρ)</div>
              <div>• τ(1, 0) = 1 + (μ · ρ)</div>
              <div>• τ(0, 1) = 1 + (λ · ρ)</div>
              <div>• τ(1, 1) = 1 - ρ</div>
              <div>• τ(x, y) = 1.0 (para marcadores superiores)</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-white font-bold text-sm">3. De-Margining y Cálculo de Valor Esperado (+EV)</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Las casas de apuestas introducen un margen artificial (Overround del 4% al 7%). Extraemos la probabilidad pura del mercado y comparamos con la probabilidad teórica del modelo:
            </p>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-amber-300">
              EV = (Probabilidad_Modelo × Cuota_Mercado) - 1
            </div>
            <p className="text-[11px] text-slate-500">
              Si EV &gt; 0, existe una ventaja matemática teórica respecto a la cotización ofrecida por el corredor.
            </p>
          </div>

          <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-500/30 flex items-start space-x-2 text-rose-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-bold">Regla Anti-Alucinación:</span> En Football Quant Lab, las probabilidades nunca provienen de una generación de texto de un LLM. El motor matemático es determinista, reproducible y verificable.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
